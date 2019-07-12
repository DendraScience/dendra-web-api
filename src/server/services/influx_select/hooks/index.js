const apiHooks = require('@dendra-science/api-hooks-common')
const commonHooks = require('feathers-hooks-common')
const math = require('../../../lib/math')
const {treeMap} = require('@dendra-science/utils')

exports.before = {
  // all: [],

  find: [
    apiHooks.coerceQuery(),

    (hook) => {
      /*
        Timeseries services must:
        * Support a 'compact' query field
        * Support a 'time[]' query field with operators $gt, $gte, $lt and $lte
        * Support a '$sort[time]' query field
        * Accept and return time values in simplified extended ISO format (ISO 8601)
       */

      const query = hook.params.query
      hook.params.coalesce = query.coalesce
      hook.params.compact = query.compact
      hook.params.time_adjust = query.time_adjust
      hook.params.utc_offset = query.utc_offset

      // Eval 'time' query field
      if (typeof query.time === 'object') {
        const queryTime = treeMap(query.time, (obj) => {
          // Only map values that were coerced, i.e. in the correct format
          if (obj instanceof Date) return new Date(obj.getTime() + (query.time_adjust | 0) * 1000)
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
    },

    commonHooks.removeQuery('coalesce', 'compact', 'time', 'time_adjust', 'utc_offset')
  ],

  get: commonHooks.disallow(),
  create: commonHooks.disallow(),
  update: commonHooks.disallow(),
  patch: commonHooks.disallow(),
  remove: commonHooks.disallow()
}

exports.after = {
  // all: []

  find (hook) {
    if (!hook.params.compact) return

    // Reformat results asynchronously; 20 items at a time (hardcoded)
    // TODO: Move hardcoded 'count' to config
    // TODO: Move this into a global hook?
    const count = 20
    const data = hook.result.data
    const code = hook.params.evaluate ? math.compile(hook.params.evaluate) : null
    const firstSeries = data.series && data.series[0]
    const columns = firstSeries ? firstSeries.columns : []
    const values = firstSeries ? firstSeries.values : []
    const timeAdjust = (hook.params.time_adjust | 0) * 1000
    const utcOffset = hook.params.utc_offset | 0
    const mapTask = function (start) {
      return new Promise(resolve => {
        setImmediate(() => {
          const len = Math.min(start + count, values.length)
          for (let i = start; i < len; i++) {
            const value = values[i]
            const item = columns.reduce((obj, key, j) => {
              obj.set(key, value[j])
              return obj
            }, new Map())
            const newItem = {}

            // Compact time values
            newItem.t = new Date((new Date(item.get('time'))).getTime() - timeAdjust)

            const itemUtcOffset = item.get('utc_offset')
            newItem.o = typeof itemUtcOffset === 'number' ? itemUtcOffset : utcOffset

            item.delete('time')
            item.delete('utc_offset')

            // Compact data values
            if (item.size === 1) {
              newItem.v = item.values().next().value
            } else if (hook.params.coalesce) {
              for (let val of item.values()) {
                if (val !== null) {
                  newItem.v = val
                  break
                }
              }
            } else {
              const d = newItem.d = {}
              item.forEach((val, key) => (d[key] = val))
            }

            if (code) {
              try {
                code.evaluate(newItem)
              } catch (_) {
              }
            }

            values[i] = newItem
          }
          resolve()
        })
      })
    }
    const tasks = []
    for (let i = 0; i < values.length; i += count) {
      tasks.push(mapTask(i))
    }
    return Promise.all(tasks).then(() => {
      hook.result.data = values
      return hook
    })
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
