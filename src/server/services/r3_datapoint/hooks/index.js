const apiHooks = require('@dendra-science/api-hooks-common')
const { disallow, iff } = require('feathers-hooks-common')
const { annotHelpers, isProd } = require('../../../lib/utils')

/**
 * Timeseries services must:
 *   Support the 'compact' query parameter
 *   Support the 'time[$op]' query parameter with operators $gt, $gte, $lt and $lte
 *   Support the 'time[$op]' query parameters in simplified extended ISO format (ISO 8601)
 *   Support the '$sort[time]' query parameter
 *   Support the 't_int' and 't_local' query parameters
 *
 * Compact times are encoded by R3. This after-hook only runs annotHelpers.
 */

exports.before = {
  // all: [],

  find: [
    iff(() => isProd, disallow('external')),
    // id stays off. organization_id and table_id are hex strings for R3.
    // Default id coercion makes ObjectIds, and qs then emits organization_id[id]=...
    apiHooks.coerceQuery({
      bool: true,
      id: false,
      num: true,
      text: true,
      utc: true
    })
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
    const items = Array.isArray(result) ? result : []
    const { code, q } = annotHelpers(params)

    // Annotate asynchronously; 24 items at a time (hardcoded)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (code) {
        try {
          code.evaluate(item)
        } catch (_) {}
      }
      if (q) item.q = q

      if (!(i % 24)) await new Promise(resolve => setImmediate(resolve))
    }
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
