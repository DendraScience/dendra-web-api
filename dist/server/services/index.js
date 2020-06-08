"use strict";

const path = require('path');

module.exports = function (app) {
  const names = ['ability', 'authentication', // 'aggregate',
  // 'aggregate_request',
  // 'aggregate_result',
  'annotation', // 'dashboard',
  // 'datapoint_lookup', // Route must precede datapoint
  'datapoint', // 'datastream_lookup', // Route must precede datastream
  'datastream', 'dendra_datapoint', 'influx_select', 'legacy_datavalue', 'membership', 'organization', 'person', 'place', 'scheme', 'som', 'station', 'system_schema', 'system_time', 'system_timezone', // 'team',
  // 'thing',
  'thing-type', 'uom', 'upload', 'user', 'vocabulary'];
  names.forEach(name => app.configure(require(path.join(__dirname, name))));
};