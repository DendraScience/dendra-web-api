"use strict";

const apiHooks = require('@dendra-science/api-hooks-common');

const auth = require('@feathersjs/authentication');

const errors = require('@feathersjs/errors');

const {
  disallow,
  iff,
  iffElse
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
  find: [iff(context => context.params.headers && context.params.headers.authorization, auth.hooks.authenticate('jwt')), setAbility(), apiHooks.coerceQuery({
    bool: true,
    id: true,
    num: true
  }), iffElse(context => context.params.query && context.params.query.time_local, apiHooks.coerceQuery({
    naive: true
  }), apiHooks.coerceQuery({
    utc: true
  })), async ({
    app,
    params
  }) => {
    if (!params.query) throw new errors.BadRequest('Expected query.');
    const {
      ability,
      headers,
      query
    } = params;
    let {
      datastream
    } = params;

    if (!datastream && query.datastream_id) {
      datastream = await app.service('datastreams').get(query.datastream_id, {
        ability: params.ability,
        provider: params.provider
      });
    }

    if (!datastream) throw new errors.BadRequest('Expected params.datastream or query.datastream_id.');
    if (!Array.isArray(datastream.datapoints_config)) throw new errors.GeneralError('Missing datastream.datapoints_config.'); // HACK: Allow if header is specified

    const action = headers['dendra-fetch-action'] === 'graph' ? 'graph' : 'download';
    datastream[TYPE_KEY] = 'datastreams';

    if (ability.cannot(action, datastream)) {
      throw new errors.Forbidden(`You are not allowed to ${action} datapoints for the datastream.`);
    } // Eval 'time' query fields


    if (query.time) {
      if (typeof query.time !== 'object') throw new errors.BadRequest('Invalid time parameter.');

      if (query.time_local) {
        if (!datastream.station_id) throw new errors.BadRequest('No datastream.station_id defined to allow query.time_local.');
        const station = await app.service('stations').get(datastream.station_id, {
          provider: null
        }); // Convert local time to UTC for downstream use

        const ms = (station.utc_offset | 0) * 1000;
        query.time = treeMap(query.time, obj => {
          // Only permit date strings that were coerced
          if (typeof obj === 'string') throw new errors.BadRequest('Invalid local time format.');
          if (typeof obj === 'number') return new Date(obj - ms);
          if (obj instanceof Date) return new Date(obj.getTime() - ms);
          return obj;
        });
      } else {
        query.time = treeMap(query.time, obj => {
          /* eslint-disable-next-line no-console */
          console.log('>>> obj', obj); // Only permit date strings that were coerced

          if (typeof obj === 'string') throw new errors.BadRequest('Invalid time format.');
          if (typeof obj === 'number') return new Date(obj);
          return obj;
        });
      }
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