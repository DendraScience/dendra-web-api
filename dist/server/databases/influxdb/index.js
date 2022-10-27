"use strict";

const Agent = require('agentkeepalive');
const {
  HttpsAgent
} = require('agentkeepalive');
const {
  InfluxDB
} = require('@influxdata/influxdb-client');
function agentOptions() {
  return {
    timeout: 60000,
    freeSocketTimeout: 30000
  };
}
const httpAgent = new Agent(agentOptions());
const httpsAgent = new HttpsAgent(agentOptions());
module.exports = async app => {
  const influxdb = app.get('databases').influxdb;
  Object.values(influxdb).forEach(cfg => {
    cfg.influxDB = new InfluxDB({
      token: cfg.token,
      transportOptions: {
        agent: cfg.url.startsWith('https:') ? httpsAgent : httpAgent
      },
      url: cfg.url
    });
    cfg.queryApi = cfg.influxDB.getQueryApi(cfg.org);
  });
};