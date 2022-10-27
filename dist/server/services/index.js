"use strict";

const path = require('path');
module.exports = function (app) {
  const names = ['ability', 'authentication', 'annotation', 'company', 'datapoint', 'datastream', 'dendra_datapoint', 'download', 'influx_flux', 'influx_select', 'legacy_datavalue', 'membership', 'monitor', 'organization', 'person', 'place', 'scheme', 'som', 'station', 'system_schema', 'system_time', 'system_timezone', 'thing-type', 'uom', 'upload', 'user', 'vocabulary', 'wof_value'];
  names.forEach(name => app.configure(require(path.join(__dirname, name))));
};