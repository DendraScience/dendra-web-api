const apiHooks = require('@dendra-science/api-hooks-common')
const commonHooks = require('feathers-hooks-common')
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
          parts.push(`(time > '${queryTime.$lt.toISOString()}')`)
        } else if (queryTime.$lte instanceof Date) {
          parts.push(`(time > '${queryTime.$lte.toISOString()}')`)
        }

        if (parts.length > 0) query.wc = parts.join(' AND ')
      }
    },

    commonHooks.removeQuery('compact', 'time', 'time_adjust', 'utc_offset')
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
    const firstSeries = data[0]
    const firstColumns = firstSeries.columns
    const firstValues = firstSeries.values
    const timeAdjust = (hook.params.time_adjust | 0) * 1000
    const utcOffset = hook.params.utc_offset | 0
    const mapTask = function (start) {
      return new Promise(resolve => {
        setImmediate(() => {
          const len = Math.min(start + count, firstValues.length)
          for (let i = start; i < len; i++) {
            const value = firstValues[i]
            const item = firstColumns.reduce((obj, key, j) => {
              obj[key] = value[j]
              return obj
            }, {})
            const newItem = {}

            // Compact time values
            newItem.t = new Date((new Date(item.time)).getTime() - timeAdjust)
            newItem.o = typeof item.utc_offset === 'number' ? item.utc_offset : utcOffset

            delete item.time
            delete item.utc_offset

            // Compact data values
            const keys = Object.keys(item)
            const v = item[keys[0]]
            if ((keys.length === 1) && (typeof v === 'number')) {
              newItem.v = v
            } else {
              newItem.d = item
            }

            firstValues[i] = newItem
          }
          resolve()
        })
      })
    }
    const tasks = []
    for (let i = 0; i < firstValues.length; i += count) {
      tasks.push(mapTask(i))
    }
    return Promise.all(tasks).then(() => {
      hook.result.data = firstValues
      return hook
    })
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
