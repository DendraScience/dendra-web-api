"use strict";

const apiHooks = require('@dendra-science/api-hooks-common');

const {
  disallow,
  iff
} = require('feathers-hooks-common');

const {
  isProd
} = require('../../../lib/utils');

const _ = require('lodash');
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
  find: [iff(() => isProd, disallow('external')), apiHooks.coerceQuery(), apiHooks.splitList('params.query.datastream_ids'), ({
    params
  }) => {
    const {
      query
    } = params; // TEST ONLY
    // params.actions = {
    //   evaluate: 'v = number(va[1] * va[2])'
    // }

    params.savedQuery = _.pick(query, ['compact']);
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
      app,
      params,
      result
    } = context;
    const {
      savedQuery
    } = params;
    if (!(savedQuery.compact && result.length)) return;
    const pools = app.get('pools');
    context.result = await pools.dendraDatapointMerge.execute({
      params,
      result
    });
  } // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []

};