'use strict';

const apiHooks = require('@dendra-science/api-hooks-common');
const commonHooks = require('feathers-hooks-common');
const math = require('../../../lib/math');
const { treeMap } = require('@dendra-science/utils');

exports.before = {
  // all: [],

  find: [apiHooks.coerceQuery(), hook => {
    /*
      Timeseries services must:
      * Support a 'compact' query field
      * Support a 'time[]' query field with operators $gt, $gte, $lt and $lte
      * Support a '$sort[time]' query field
      * Accept and return time values in simplified extended ISO format (ISO 8601)
     */

    const query = hook.params.query;
    hook.params.compact = query.compact;

    // Eval 'time' query field
    if (typeof query.time === 'object') {
      query.local_date_time = treeMap(query.time, obj => {
        // Only map values that were coerced, i.e. in the correct format
        if (obj instanceof Date) return new Date(obj.getTime() + (query.time_adjust | 0) * 1000);
        return null;
      });
    }

    // Eval $sort query field
    if (typeof query.$sort === 'object' && typeof query.$sort.time !== 'undefined') {
      query.$sort = { local_date_time: query.$sort.time };
    }
  }, commonHooks.removeQuery('compact', 'time', 'time_adjust')],

  get: commonHooks.disallow(),
  create: commonHooks.disallow(),
  update: commonHooks.disallow(),
  patch: commonHooks.disallow(),
  remove: commonHooks.disallow()
};

exports.after = {
  // all: []

  find(hook) {
    if (!hook.params.compact) return;

    // Reformat results asynchronously; 20 items at a time (hardcoded)
    // TODO: Move hardcoded 'count' to config
    // TODO: Move this into a global hook?
    const count = 20;
    const data = hook.result.data;
    const code = hook.params.evaluate ? math.compile(hook.params.evaluate) : null;
    const mapTask = function (start) {
      return new Promise(resolve => {
        setImmediate(() => {
          const len = Math.min(start + count, data.length);
          for (let i = start; i < len; i++) {
            const item = data[i];
            const newItem = { t: item.utc_date_time, o: item.utc_offset_secs, v: item.value };

            if (code) {
              try {
                code.evaluate(newItem);
              } catch (_) {}
            }

            data[i] = newItem;
          }
          resolve();
        });
      });
    };
    const tasks = [];
    for (let i = 0; i < data.length; i += count) {
      tasks.push(mapTask(i));
    }
    return Promise.all(tasks).then(() => {
      return hook;
    });
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
};