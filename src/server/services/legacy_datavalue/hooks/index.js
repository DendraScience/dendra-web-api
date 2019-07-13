const apiHooks = require('@dendra-science/api-hooks-common')
const math = require('mathjs')
const { disallow, iff } = require('feathers-hooks-common')
const { isProd, tKeyVal } = require('../../../lib/utils')
const { treeMap } = require('@dendra-science/utils')
const _ = require('lodash')

/**
 * Timeseries services must:
 *   Support a 'compact' query parameter
 *   Support a 'time[]' query parameter with operators $gt, $gte, $lt and $lte
 *   Support a 'time[]' query parameter in simplified extended ISO format (ISO 8601)
 *   Support a '$sort[time]' query parameter
 *   Return a 't' or 'lt' field based on the query parameters t_int and t_local
 */

exports.before = {
  // all: [],

  find: [
    iff(() => isProd, disallow('external')),

    apiHooks.coerceQuery(),

    ({ params }) => {
      const { query } = params

      params.savedQuery = _.pick(query, ['compact', 't_int', 't_local'])

      const newQuery = _.pick(query, ['datastream_id', '$limit'])

      // Eval 'time' query field
      if (typeof query.time === 'object') {
        newQuery.local_date_time = treeMap(query.time, obj => {
          // Only map values that were coerced, i.e. in the correct format
          if (obj instanceof Date)
            return new Date(obj.getTime() + (query.time_adjust | 0) * 1000)
          return null
        })
      }

      // Eval $sort query field
      if (query.$sort && typeof query.$sort.time !== 'undefined') {
        newQuery.$sort = {
          local_date_time: query.$sort.time
        }
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
    const { actions, annotationIds, savedQuery } = params

    if (!savedQuery.compact) return

    savedQuery.local = true
    const t = tKeyVal(savedQuery)

    let code
    if (actions && actions.evaluate) {
      try {
        code = math.compile(actions.evaluate)
      } catch (_) {}
    }

    let quality
    if (annotationIds) {
      quality = {
        annotation_ids: annotationIds
      }
    }
    if (actions && actions.flag) {
      if (!quality) quality = {}
      quality.flag = actions.flag
    }

    // Reformat results asynchronously; 20 items at a time (hardcoded)
    for (let i = 0; i < result.length; i++) {
      let item = result[i]

      item = {
        [t.key]: t.val(item.local_date_time, item.utc_offset * 3600000),
        o: item.utc_offset * 3600,
        v: item.value
      }

      if (code) {
        try {
          code.evaluate(item)
        } catch (_) {}
      }
      if (quality) item.q = quality

      result[i] = item

      if (!(i % 20)) await new Promise(resolve => setImmediate(resolve))
    }
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
