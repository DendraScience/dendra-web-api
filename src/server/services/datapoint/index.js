const { filterQuery } = require('@feathersjs/adapter-commons')
const { Interval } = require('@dendra-science/utils')
const { mergeConfig, MAX_TIME, MIN_TIME } = require('../../lib/datapoints')

const hooks = require('./hooks')

/**
 * High-level service that provides a standard facade to retrieve datapoints.
 *
 * This service forwards 'find' requests to one or more low-level services based on
 * config instances listed under datapoints_config_built or datapoints_config.
 */
class Service {
  constructor(options) {
    this.options = Object.assign(
      {
        paginate: {}
      },
      options
    )
  }

  setup(app) {
    this.app = app
    this.connections = app.get('connections')
  }

  async find(params) {
    const { query, filters } = filterQuery(params.query || {}, {
      paginate: this.options.paginate
    })
    const { datastream, queryDepth } = params

    // Points can only be sorted by 'time' (default DESC)
    filters.$sort = {
      time:
        typeof filters.$sort === 'object' && filters.$sort.time !== undefined
          ? filters.$sort.time
          : -1
    }

    let config = []
    let refd

    if (typeof datastream === 'object') {
      const hasConfig = Array.isArray(datastream.datapoints_config)
      const hasBuilt = Array.isArray(datastream.datapoints_config_built)

      if (query.config === 0 && hasConfig) config = datastream.datapoints_config
      else if (hasBuilt) config = datastream.datapoints_config_built
      else if (hasConfig) config = datastream.datapoints_config

      if (Array.isArray(datastream.datapoints_config_refd))
        refd = datastream.datapoints_config_refd
    }

    config = mergeConfig(config, {
      refd,
      reverse: filters.$sort.time === -1,
      service: this
    })

    /*
      Construct a query interval based on 'time' query field.
     */
    const queryInterval = new Interval(MIN_TIME, MAX_TIME, false, true)

    if (typeof query.time === 'object') {
      const queryTime = query.time

      if (queryTime.$gt instanceof Date) {
        queryInterval.start = queryTime.$gt.getTime()
        queryInterval.leftOpen = true
      } else if (queryTime.$gte instanceof Date) {
        queryInterval.start = queryTime.$gte.getTime()
        queryInterval.leftOpen = false // Closed interval
      }

      if (queryTime.$lt instanceof Date) {
        queryInterval.end = queryTime.$lt.getTime()
        queryInterval.rightOpen = true
      } else if (queryTime.$lte instanceof Date) {
        queryInterval.end = queryTime.$lte.getTime()
        queryInterval.rightOpen = false // Closed interval
      }
    }

    /*
      Iterate over config instances and query low-level services where the query
      interval intersects the instance's interval.
     */
    const result = {
      limit: filters.$limit,
      data: []
    }

    for (const inst of config) {
      // Intersect intervals; skip querying if empty
      const interval = queryInterval.intersect(
        new Interval(inst.beginsAt, inst.endsBefore, false, true)
      )
      if (interval.empty) continue

      /*
        Construct a low-level query using the clamped interval and config instance
        fields. Do this only if we haven't reached our limit.
       */
      if (result.data.length >= filters.$limit) break

      const p = Object.assign({}, inst.params1, inst.params2, {
        provider: null,
        queryDepth: queryDepth === undefined ? 1 : queryDepth + 1
      })
      const q = (p.query = Object.assign({}, p.query))

      q.$limit = filters.$limit - result.data.length
      q.$sort = filters.$sort
      q.compact = true
      if (datastream.derived_from_datastream_ids)
        q.datastream_ids = datastream.derived_from_datastream_ids
      if (query.lat !== undefined) q.lat = query.lat
      if (query.lon !== undefined) q.lon = query.lon
      if (query.lng !== undefined) q.lng = query.lng
      if (query.t_int) q.t_int = query.t_int
      if (query.t_local) q.t_local = query.t_local
      q.time = {}
      q.time[interval.leftOpen ? '$gt' : '$gte'] = new Date(interval.start)
      q.time[interval.rightOpen ? '$lt' : '$lte'] = new Date(interval.end)

      // Call the low-level service!
      const res = await inst.connection.app.service(inst.path).find(p)

      // Combine the results
      // TODO: Not the most efficient, optimize somehow?
      if (Array.isArray(res)) result.data = result.data.concat(res)
      else if (Array.isArray(res.data))
        result.data = result.data.concat(res.data)
    }

    return result
  }
}

module.exports = function (app) {
  const services = app.get('services')

  if (!services.datapoint) return

  app.use(
    '/datapoints',
    new Service({
      paginate: services.datapoint.paginate
    })
  )

  // Get the wrapped service object, bind hooks
  app.service('datapoints').hooks(hooks)
}
