const path = require('path')

module.exports = function (app) {
  const names = [
    'ability',
    'authentication',
    // 'aggregate',
    // 'aggregate_request',
    // 'aggregate_result',
    'annotation',
    'company',
    // 'dashboard',
    // 'datapoint_lookup', // Route must precede datapoint
    'datapoint',
    // 'datastream_lookup', // Route must precede datastream
    'datastream',
    'dendra_datapoint',
    'download',
    'influx_select',
    'legacy_datavalue',
    'membership',
    'monitor',
    'organization',
    'person',
    'place',
    'scheme',
    'som',
    'station',
    'system_schema',
    'system_time',
    'system_timezone',
    // 'team',
    // 'thing',
    'thing-type',
    'uom',
    'upload',
    'user',
    'vocabulary',
    'wof_value'
  ]

  names.forEach(name => app.configure(require(path.join(__dirname, name))))
}
