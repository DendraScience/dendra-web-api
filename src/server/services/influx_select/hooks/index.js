const apiHooks = require('@dendra-science/api-hooks-common')
const { disallow, iff } = require('feathers-hooks-common')
const { annotHelpers, isProd, tKeyVal } = require('../../../lib/utils')
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

      params.savedQuery = _.pick(query, [
        'coalesce',
        'compact',
        'local',
        't_int',
        't_local',
        'utc_offset'
      ])

      // Eval 'time' query field
      if (typeof query.time === 'object') {
        const queryTime = treeMap(query.time, obj => {
          // Only map values that were coerced, i.e. in the correct format
          if (obj instanceof Date)
            return new Date(obj.getTime() + (query.time_adjust | 0) * 1000)
          return null
        })

        const parts = []

        // Append time criteria after the given WHERE clause
        if (typeof query.wc === 'string') parts.push(`(${query.wc})`)

        if (queryTime.$gt instanceof Date) {
          parts.push(`(time > '${queryTime.$gt.toISOString()}')`)
        } else if (queryTime.$gte instanceof Date) {
          parts.push(`(time >= '${queryTime.$gte.toISOString()}')`)
        }

        if (queryTime.$lt instanceof Date) {
          parts.push(`(time < '${queryTime.$lt.toISOString()}')`)
        } else if (queryTime.$lte instanceof Date) {
          parts.push(`(time <= '${queryTime.$lte.toISOString()}')`)
        }

        if (parts.length > 0) query.wc = parts.join(' AND ')
      }
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

  find: async context => {
    const { params, result } = context
    const { savedQuery } = params

    if (!savedQuery.compact) return

    const t = tKeyVal(savedQuery)
    const h = annotHelpers(params)

    const firstSeries = result.series && result.series[0]
    const columns = firstSeries ? firstSeries.columns : []
    const values = firstSeries ? firstSeries.values : []

    // Build a map between column names and value indexes
    const colsMap = columns.reduce((map, key, i) => map.set(key, i), new Map())
    const timeIndex = colsMap.get('time')
    const utcOffsetIndex = colsMap.get('utc_offset')
    colsMap.delete('time')
    colsMap.delete('utc_offset')

    const utcOffset = savedQuery.utc_offset | 0
    const getOffset =
      utcOffsetIndex === undefined
        ? () => utcOffset
        : value => value[utcOffsetIndex] || utcOffset

    const setData =
      savedQuery.coalesce || colsMap.size === 1 // TODO: Revisit this
        ? (item, value) => {
            for (let [, i] of colsMap) {
              if (value[i] !== null) {
                item.v = value[i]
                break
              }
            }
          }
        : (item, value) => {
            item.d = {}
            for (let [key, i] of colsMap) {
              item.d[key] = value[i]
            }
          }

    // Reformat results asynchronously; 20 items at a time (hardcoded)
    for (let i = 0; i < values.length; i++) {
      const value = values[i]
      const offset = getOffset(value)

      const item = {
        [t.key]: t.val(new Date(value[timeIndex]), offset * 1000),
        o: offset
      }

      setData(item, value)

      if (h.code) {
        try {
          h.code.evaluate(item)
        } catch (_) {}
      }
      if (h.q) item.q = h.q

      values[i] = item

      if (!(i % 20)) await new Promise(resolve => setImmediate(resolve))
    }

    context.result = values
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
