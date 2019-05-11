"use strict";

const apiHooks = require('@dendra-science/api-hooks-common');

const auth = require('@feathersjs/authentication');

const errors = require('@feathersjs/errors');

const {
  disallow,
  iff
} = require('feathers-hooks-common');

const {
  treeMap
} = require('@dendra-science/utils');

const setAbility = require('../../../hooks/setAbility');

const {
  TYPE_KEY
} = require('../../../lib/ability');

exports.before = {
  // all: [],
  find: [iff(context => context.params.headers && context.params.headers.authorization, auth.hooks.authenticate('jwt')), setAbility(), apiHooks.coerceQuery(), async ({
    app,
    params
  }) => {
    if (!params.query) throw new errors.BadRequest('Expected query.');
    const {
      ability,
      query
    } = params;
    let {
      datastream
    } = params;

    if (!datastream && query.datastream_id) {
      datastream = await app.service('datastreams').get(query.datastream_id, {
        provider: params.provider
      });
    }

    if (!datastream) throw new errors.BadRequest('Expected params.datastream or query.datastream_id.');
    if (!Array.isArray(datastream.datapoints_config)) throw new errors.GeneralError('Missing datastream.datapoints_config.');
    datastream[TYPE_KEY] = 'datastreams';

    if (ability.cannot('download', datastream)) {
      throw new errors.Forbidden(`You are not allowed to download datapoints for the datastream.`);
    } // Eval 'time_local' query field


    if (typeof query.time === 'object' && query.time_local) {
      if (!datastream.station_id) throw new errors.BadRequest('No datastream.station_id defined to allow query.time_local.');
      const station = await app.service('stations').get(datastream.station_id, {
        provider: null
      }); // Convert station time to UTC for downstream use

      const offset = station.utc_offset | 0;
      query.time = treeMap(query.time, obj => {
        // Only map values that were coerced, i.e. in the correct format
        if (obj instanceof Date) return new Date(obj.getTime() - offset * 1000);
        return obj;
      });
    }

    params.datastream = datastream;
  }],
  get: disallow(),
  create: disallow(),
  update: disallow(),
  patch: disallow(),
  remove: disallow()
};
exports.after = {// all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
};