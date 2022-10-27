const errors = require('@feathersjs/errors')
const { toFluxValue } = require('@influxdata/influxdb-client')
const hooks = require('./hooks')
const { MAX_TIME, MIN_TIME } = require('../../lib/datapoints')

/**
 * Custom service that submits an InfluxDB Flux query using query parameters:
 *
 *   custom[asc] - override with a custom Flux query for ascending
 *   custom[desc] - override with a custom Flux query for descending
 *   custom[count] - override with a custom Flux query for a count operation
 *   tag_set[key] - tag set (all tag key-value pairs) to filter on
 *   fields[] - field names to filter on (defaults to all fields)
 *   measurement - measurement name to filter on (defaults to 'logger_data')
 *   time[$op] - casted time objects with operators $gt, $gte, $lt and $lte (optional)
 *   $sort[time] - pass (-1) to return the most recent timestamps first
 *   $limit - return the first N points
 *   database - config key pointing to an InfluxDB instance (defaults to 'default')
 *   bucket - bucket name (required)
 *   fn - perform an aggregation function, e.g. count
 */
class Service {
  constructor(options) {
    this.databases = options.databases || {}
  }

  setup(app) {
    this.app = app
    this.logger = app.logger
  }

  async find(params) {
    const query = params.query || {}
    const {
      bucket,
      custom,
      database,
      fields,
      fn,
      measurement,
      time,
      tag_set: tagSet,
      $sort: sort,
      $limit: limit
    } = query
    const cfg = this.databases[database] || this.databases.default

    if (!cfg)
      throw new errors.GeneralError('Influx flux database config undefined.')
    if (!(fn === undefined || fn === 'count'))
      throw new errors.GeneralError(`Influx flux fn '${fn}' not supported.`)

    const isDesc = sort && sort.time === -1
    const isTimeGt = time && time.$gt instanceof Date
    const isTimeGte = time && time.$gte instanceof Date
    const isTimeLt = time && time.$lt instanceof Date
    const isTimeLte = time && time.$lte instanceof Date

    const queryKey = fn || (isDesc ? 'desc' : 'asc')
    const queryStartDate = isTimeGt
      ? new Date(time.$gt.getTime() + 1)
      : isTimeGte
      ? time.$gte
      : new Date(MIN_TIME)
    const queryStopDate = isTimeLt
      ? time.$lt
      : isTimeLte
      ? new Date(time.$lte.getTime() + 1)
      : new Date(MAX_TIME)

    let q

    if (typeof custom === 'object' && typeof custom[queryKey] === 'string') {
      const vars = {
        START: queryStartDate,
        STOP: queryStopDate
      }
      q = custom[queryKey].replace(/@{([.\w]+)}/g, (_, v) =>
        toFluxValue(vars[v])
      )
    } else {
      if (typeof bucket !== 'string')
        throw new errors.GeneralError(
          'Influx flux requries query.bucket (string).'
        )

      // Use from() to define the bucket
      const parts = [`from(bucket: ${toFluxValue(bucket)})`]

      // Use range() to limit query results by time
      parts.push(
        `range(start: ${toFluxValue(queryStartDate)}, stop: ${toFluxValue(
          queryStopDate
        )})`
      )

      // Use filter() to identify the measurement
      parts.push(
        `filter(fn: (r) => r._measurement == ${toFluxValue(
          typeof measurement === 'string' ? measurement : 'logger_data'
        )})`
      )

      // Use filter() to narrow down to specific tag key-value pairs
      if (typeof tagSet === 'object' && Object.keys(tagSet).length)
        parts.push(
          'filter(fn: (r) => ' +
            Object.entries(tagSet)
              .map(
                ([k, v]) =>
                  `r[${toFluxValue(k + '')}] == ${toFluxValue(v + '')}`
              )
              .join(' and ') +
            ')'
        )

      // Use filter() to select specific fields
      if (Array.isArray(fields) && fields.length)
        parts.push(
          'filter(fn: (r) => ' +
            fields
              .map(name => `r._field == ${toFluxValue(name)}`)
              .join(' or ') +
            ')'
        )

      // Functions require special handling
      if (fn) {
        parts.push(fn + '()')
        parts.push(
          'pivot(rowKey: ["_measurement"], columnKey: ["_field"], valueColumn: "_value")'
        )
        parts.push(
          `drop(columns: ${toFluxValue([
            '_measurement',
            '_stop',
            ...(typeof tagSet === 'object' ? Object.keys(tagSet) : [])
          ])})`
        )
      } else {
        if (limit !== undefined) {
          if (sort && sort.time === -1) parts.push(`tail(n: ${limit | 0})`)
          else parts.push(`limit(n: ${limit | 0})`)
        }

        if (sort && sort.time === -1)
          parts.push('sort(columns: ["_time"], desc: true)')

        parts.push(
          'pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")'
        )
        parts.push(
          `drop(columns: ${toFluxValue([
            '_measurement',
            '_start',
            '_stop',
            ...(typeof tagSet === 'object' ? Object.keys(tagSet) : [])
          ])})`
        )
      }

      q = parts.join('\n |> ')
    }

    this.logger.debug(`// Flux query\n${q}`)

    let data = await cfg.queryApi.collectRows(q)

    // Remap _start to _time if a function is used
    if (fn) data = data.map(({ _start: _time, ...row }) => ({ _time, ...row }))

    return data
  }
}

module.exports = function (app) {
  const databases = app.get('databases')

  if (!databases.influxdb) return

  app.use(
    '/influx/flux',
    new Service({
      databases: databases.influxdb
    })
  )

  // Get the wrapped service object, bind hooks
  app.service('influx/flux').hooks(hooks)
}
