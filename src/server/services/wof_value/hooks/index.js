const apiHooks = require('@dendra-science/api-hooks-common')
const { disallow, iff } = require('feathers-hooks-common')
const { annotHelpers, isProd, timeHelpers } = require('../../../lib/utils')
const { treeMap } = require('@dendra-science/utils')
const _ = require('lodash')

/**
 * Timeseries services must:
 *   Support the 'compact' query parameter
 *   Support the 'time[]' query parameter with operators $gt, $gte, $lt and $lte
 *   Support the 'time[]' query parameter in simplified extended ISO format (ISO 8601)
 *   Support the '$sort[time]' query parameter
 *   Support the 't_int' and 't_local' query parameters
 */

exports.before = {
  // all: [],

  find: [
    iff(() => isProd, disallow('external')),

    apiHooks.coerceQuery(),

    ({ params }) => {
      const { query } = params

      params.savedQuery = _.pick(query, ['compact', 't_int', 't_local'])

      const newQuery = _.pick(query, [
        'censor_code',
        'fetch_interval',
        'fetch_limit',
        'location',
        'quality_control_level_code',
        'url',
        'variable',
        '$limit',
        '$sort'
      ])

      // Eval 'time' query field
      if (typeof query.time === 'object') {
        newQuery.time = treeMap(query.time, obj => {
          // Only map values that were coerced, i.e. in the correct format
          if (obj instanceof Date)
            return new Date(obj.getTime() + (query.time_adjust | 0) * 1000)
          return null
        })
      }

      params.query = newQuery
    }
  ],

  get: disallow(),
  create: disallow(),
  update: disallow(),
  patch: disallow(),
  remove: disallow()
}

exports.after = {
  // all: []

  find: async ({ params, result }) => {
    const { savedQuery } = params

    if (!savedQuery.compact) return

    savedQuery.local = true
    const { t_local: tLocal } = savedQuery
    const { lt, t } = timeHelpers(params)
    const { code, q } = annotHelpers(params)

    // Reformat results asynchronously; 24 items at a time (hardcoded)
    for (let i = 0; i < result.length; i++) {
      let item = result[i]
      const ldt = item.dateTime
      const ms = item.timeOffset * 60000

      item = tLocal
        ? {
            lt: lt(ldt, ms),
            o: item.timeOffset * 60,
            v: item.value
          }
        : {
            lt: lt(ldt, ms),
            t: t(ldt, ms),
            v: item.value
          }

      if (code) {
        try {
          code.evaluate(item)
        } catch (_) {}
      }
      if (q) item.q = q

      result[i] = item

      if (!(i % 24)) await new Promise(resolve => setImmediate(resolve))
    }
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
