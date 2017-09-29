'use strict';

var _feathersQueryFilters = require('feathers-query-filters');

var _feathersQueryFilters2 = _interopRequireDefault(_feathersQueryFilters);

var _feathersErrors = require('feathers-errors');

var _hooks = require('./hooks');

var _hooks2 = _interopRequireDefault(_hooks);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Low-level service to retrieve Influx points.
 *
 * Since this sits behind another service; we're less fussy about santizing parameters.
 */
class Service {
  constructor(options) {
    this.apis = options.apis;
    this.paginate = options.paginate || {};
  }

  _find(params, getFilter = _feathersQueryFilters2.default) {
    const { query, filters } = getFilter(params.query || {});
    const api = this.apis[query.api] || this.apis.default;
    const influxUrl = api && api.url;
    const parts = [`SELECT ${typeof query.sc === 'string' ? query.sc : '*'}`, `FROM ${typeof query.fc === 'string' ? query.fc : 'logger_data'}`];

    if (typeof query.wc === 'string') parts.push(`WHERE ${query.wc}`);
    if (typeof query.gbc === 'string') parts.push(`GROUP BY ${query.gbc}`);
    if (filters.$sort && filters.$sort.time && filters.$sort.time === -1) parts.push('ORDER BY time DESC');
    if (typeof filters.$limit !== 'undefined') parts.push(`LIMIT ${filters.$limit}`);

    // Limited to only one series for now
    parts.push('SLIMIT 1');

    const requestOpts = {
      method: 'GET',
      qs: {
        db: query.db,
        q: parts.join(' ')
      },
      url: `${influxUrl}/query`
    };

    return new Promise((resolve, reject) => {
      (0, _request2.default)(requestOpts, (err, response) => err ? reject(err) : resolve(response));
    }).then(response => {
      if (response.statusCode !== 200) throw new _feathersErrors.errors.BadRequest(`Non-success status code ${response.statusCode}`);

      return JSON.parse(response.body);
    }).then(body => {
      // Stay async-friendly
      return new Promise((resolve, reject) => {
        setImmediate(() => {
          const result = body && body.results && body.results[0];

          if (result.error) {
            reject(new _feathersErrors.errors.BadRequest('Error result returned', {
              error: result.error
            }));
          } else if (result.series && result.series.length > 0) {
            // TODO: Revisit this!!!
            resolve({
              limit: filters.$limit,
              data: result.series
            });
          } else {
            reject(new _feathersErrors.errors.BadRequest('No result returned'));
          }
        });
      });
    });
  }

  find(params) {
    const paginate = typeof params.paginate !== 'undefined' ? params.paginate : this.paginate;
    const result = this._find(params, query => (0, _feathersQueryFilters2.default)(query, paginate));

    if (!(paginate && paginate.default)) {
      return result.then(page => page.data);
    }

    return result;
  }
}

module.exports = function () {
  return function () {
    const app = this;
    const services = app.get('services');

    if (services.influx_select) {
      app.use('/influx/select', new Service({
        apis: services.influx_select.apis,
        paginate: services.influx_select.paginate
      }));

      // Get the wrapped service object, bind hooks
      const selectService = app.service('/influx/select');

      selectService.before(_hooks2.default.before);
      selectService.after(_hooks2.default.after);
    }
  };
}();