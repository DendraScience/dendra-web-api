"use strict";

const apiHooks = require('@dendra-science/api-hooks-common');
const {
  disallow,
  iff
} = require('feathers-hooks-common');
const {
  annotHelpers,
  isProd,
  timeHelpers
} = require('../../../lib/utils');
const {
  treeMap
} = require('@dendra-science/utils');
const _ = require('lodash');

/**
 * Timeseries services must:
 *   Support the 'compact' query parameter
 *   Support the 'time[$op]' query parameter with operators $gt, $gte, $lt and $lte
 *   Support the 'time[$op]' query parameters in simplified extended ISO format (ISO 8601)
 *   Support the '$sort[time]' query parameter
 *   Support the 't_int' and 't_local' query parameters
 *   Support the 'fn' query parameter (optional)
 */

exports.before = {
  // all: [],

  find: [iff(() => isProd, disallow('external')), apiHooks.coerceQuery(), ({
    params
  }) => {
    const {
      query
    } = params;
    params.savedQuery = _.pick(query, ['coalesce', 'compact', 'local', 'fields', 'fn', 'shift', 't_int', 't_local', 'utc_offset', 'v_field']);
    const newQuery = _.pick(query, ['bucket', 'custom', 'database', 'fields', 'fn', 'measurement', 'tag_set', '$limit', '$sort']);

    // Eval 'time' query field
    if (typeof query.time === 'object') {
      newQuery.time = treeMap(query.time, obj => {
        // Only map values that were coerced, i.e. in the correct format
        if (obj instanceof Date) return new Date(obj.getTime() + (query.shift | 0) * 1000);
        return null;
      });
    }
    params.query = newQuery;
  }],
  get: disallow(),
  create: disallow(),
  update: disallow(),
  patch: disallow(),
  remove: disallow()
};
exports.after = {
  // all: []

  find: async context => {
    const {
      params,
      result
    } = context;
    const {
      savedQuery
    } = params;
    if (!savedQuery.compact && result.length) return;
    const {
      coalesce,
      fields,
      fn,
      t_local: tLocal,
      v_field: vField
    } = savedQuery;
    const {
      lt,
      t
    } = timeHelpers(params);
    const {
      code,
      q
    } = annotHelpers(params);
    const offset = savedQuery.utc_offset | 0;
    const ms = offset * 1000;
    const setData = typeof vField === 'string' ? (item, row) => {
      const {
        _time,
        result,
        table,
        [vField]: v,
        ...d
      } = row;
      if (v !== undefined) item.v = v;
      if (Object.keys(d).length) item.d = d;
    } : coalesce && Array.isArray(fields) && fields.length ? (item, row) => {
      const {
        _time,
        result,
        table,
        ...d
      } = row;
      for (const name of fields) {
        const v = d[name];
        if (v !== undefined && v !== null) {
          item.v = v;
          break;
        }
      }
    } : (item, row) => {
      const {
        _time,
        result,
        table,
        ...d
      } = row;
      if (Object.keys(d).length) item.d = d;
    };

    // Reformat results asynchronously; 24 items at a time (hardcoded)
    for (let i = 0; i < result.length; i++) {
      const row = result[i];
      const dt = new Date(row._time);
      const item = tLocal ? {
        lt: lt(dt, ms),
        o: offset
      } : {
        lt: lt(dt, ms),
        t: t(dt, ms)
      };
      setData(item, row);
      if (code && !fn) {
        try {
          code.evaluate(item);
        } catch (_) {}
      }
      if (q) item.q = q;
      result[i] = item;
      if (!(i % 24)) await new Promise(resolve => setImmediate(resolve));
    }
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
};