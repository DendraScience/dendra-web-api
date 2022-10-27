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
const _ = require('lodash');
const setAbility = require('../../../hooks/setAbility');
const {
  TYPE_KEY
} = require('../../../lib/ability');
const math = require('../../../lib/math');
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
    if (params.queryDepth > 3) throw new errors.BadRequest('Query depth exceeded.');
    const {
      ability,
      headers,
      provider,
      query
    } = params;
    let {
      datastream
    } = params;
    if (!datastream && query.datastream_id) {
      datastream = await app.service('datastreams').get(query.datastream_id, {
        ability,
        provider
      });
    }
    if (!datastream) throw new errors.BadRequest('Expected params.datastream or query.datastream_id.');
    if (!Array.isArray(datastream.datapoints_config)) throw new errors.GeneralError('Missing datastream.datapoints_config.');
    if (provider) {
      // HACK: Allow if header is specified
      const action = headers && headers['dendra-fetch-action'] === 'graph' ? 'graph' : 'download';
      datastream[TYPE_KEY] = 'datastreams';
      if (ability.cannot(action, datastream)) {
        throw new errors.Forbidden(`You are not allowed to ${action} datapoints for the datastream.`);
      }
    }

    // Eval 'time' query fields
    if (query.time) {
      if (typeof query.time !== 'object') throw new errors.BadRequest('Invalid time parameter.');
      if (query.time_local) {
        let station = datastream.station_lookup;
        if (!station) {
          if (!datastream.station_id) throw new errors.BadRequest('No datastream.station_id defined to allow query.time_local.');
          station = await app.service('stations').get(datastream.station_id, {
            provider: null
          });
        }

        // Convert local time to UTC for downstream use
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
          // Only permit date strings that were coerced
          if (typeof obj === 'string') throw new errors.BadRequest('Invalid time format.');
          if (typeof obj === 'number') return new Date(obj);
          return obj;
        });
      }
    }

    // Eval 'uom_id' query field
    if (query.uom_id) {
      // Get target unit of measure
      const targetUom = await app.service('uoms').get(query.uom_id, {
        provider: null
      });
      if (!(datastream.terms_info && datastream.terms_info.unit_tag)) throw new errors.BadRequest('No datastream.terms_info.unit_tag defined to allow unit conversion.');

      // Find source unit of measure based on unit tag
      const unitTag = datastream.terms_info.unit_tag;
      const uoms = await app.service('uoms').find({
        paginate: false,
        provider: null,
        query: {
          unit_tags: unitTag,
          $limit: 1
        }
      });
      if (!uoms.length) throw new errors.BadRequest(`No unit of measure (uom) found for '${unitTag}'.`);

      // Ensure that we have Math.js library settings
      const sourceUom = uoms[0];
      const sourceUnitName = _.get(sourceUom, 'library_config.mathjs.unit_name');
      const targetUnitName = _.get(targetUom, 'library_config.mathjs.unit_name');
      if (!(sourceUnitName && targetUnitName)) throw new errors.BadRequest('No library_config.mathjs.unit_name defined to allow unit conversion.');
      params.sourceUnitName = sourceUnitName;
      params.targetUnitName = targetUnitName;
    }
    params.datastream = datastream;
  }],
  get: disallow(),
  create: disallow(),
  update: disallow(),
  patch: disallow(),
  remove: disallow()
};
exports.after = {
  // all: [],

  find: async ({
    params,
    result
  }) => {
    const {
      sourceUnitName,
      targetUnitName
    } = params;
    const {
      data
    } = result;
    if (!(data && sourceUnitName && targetUnitName)) return;

    // Convert results asynchronously; 24 items at a time (hardcoded)
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (typeof item.v === 'number') item.uv = sourceUnitName === targetUnitName // Simulate conversion if the same unit name
      ? item.v : math.unit(item.v, sourceUnitName).toNumber(targetUnitName);
      if (!(i % 24)) await new Promise(resolve => setImmediate(resolve));
    }
  }

  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
};