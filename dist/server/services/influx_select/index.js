"use strict";

const errors = require('@feathersjs/errors');
const Agent = require('agentkeepalive');
const {
  HttpsAgent
} = require('agentkeepalive');
const axios = require('axios');
const instance = axios.create({
  httpAgent: new Agent({
    timeout: 60000,
    freeSocketTimeout: 30000
  }),
  httpsAgent: new HttpsAgent({
    timeout: 60000,
    freeSocketTimeout: 30000
  }),
  maxRedirects: 0,
  timeout: 180000
});
const hooks = require('./hooks');

/**
 * Custom service that submits an InfluxDB SELECT using query parameters:
 *
 *   SELECT <sc> FROM <fc> WHERE <wc> GROUP BY <gbc> [ORDER BY time DESC] [LIMIT $limit]
 *
 *   sc - select clause (defaults to '*')
 *   fc - from clause (defaults to 'logger_data')
 *   wc - where clause (optional)
 *   gbc - group by clause (optional)
 *   $sort[time] - pass (-1) to return the most recent timestamps first
 *   $limit - return the first N points
 *   api - config key pointing to an InfluxDB HTTP API (defaults to 'default')
 *   db - database name (required)
 */
class Service {
  constructor(options) {
    this.apis = options.apis || {};
  }
  setup(app) {
    this.app = app;
    this.logger = app.logger;
  }
  async find(params) {
    const query = params.query || {};
    const {
      api,
      db,
      sc,
      fc,
      wc,
      gbc,
      $sort: sort,
      $limit: limit
    } = query;
    const apiConfig = this.apis[api] || this.apis.default;
    const influxUrl = apiConfig && apiConfig.url;
    if (!influxUrl) throw new errors.GeneralError('Influx select URL undefined.');
    if (!db) throw new errors.GeneralError('Influx select requries query.db.');
    const parts = [`SELECT ${typeof sc === 'string' ? sc : '*'}`, `FROM ${typeof fc === 'string' ? fc : 'logger_data'}`];
    if (typeof wc === 'string') parts.push(`WHERE ${wc}`);
    if (typeof gbc === 'string') parts.push(`GROUP BY ${gbc}`);
    if (sort && sort.time === -1) parts.push('ORDER BY time DESC');
    if (limit !== undefined) parts.push(`LIMIT ${parseInt(limit) || 0}`);

    // Limited to only one series for now
    parts.push('SLIMIT 1');
    const q = parts.join(' ');
    const queryConfig = {
      params: {
        db,
        q
      }
    };
    const queryUrl = `${influxUrl}/query`;
    this.logger.debug(`GET ${influxUrl}/query?db=${db}&q=${q}`);
    let response;
    try {
      response = await instance.get(queryUrl, queryConfig);
    } catch (err) {
      // Retry in case of keep-alive race
      // SEE: https://github.com/node-modules/agentkeepalive#support-reqreusedsocket
      if (err.request && err.request.reusedSocket && err.code === 'ECONNRESET') {
        this.logger.warn(`ECONNRESET retrying GET ${influxUrl}/query?db=${db}&q=${q}`);
        response = await instance.get(queryUrl, queryConfig);
      } else throw err;
    }
    if (response.status !== 200) throw new errors.BadRequest(`Non-success status code ${response.status}`);
    const body = response.data;
    if (!body) throw new errors.BadRequest('No body returned');
    if (body.error) throw new errors.BadRequest('Error returned', {
      error: body.error
    });
    const firstResult = body.results && body.results[0];
    if (!firstResult) throw new errors.BadRequest('No result returned');
    if (firstResult.error) throw new errors.BadRequest('Error result returned', {
      error: firstResult.error
    });
    return firstResult;
  }
}
module.exports = function (app) {
  const services = app.get('services');
  if (!services.influx_select) return;
  app.use('/influx/select', new Service({
    apis: services.influx_select.apis
  }));

  // Get the wrapped service object, bind hooks
  app.service('influx/select').hooks(hooks);
};