"use strict";

const errors = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const {
  iff
} = require('feathers-hooks-common');
const {
  mergeConfig
} = require('../../../lib/datapoints');
const {
  idRandom,
  Visibility
} = require('../../../lib/utils');
const _ = require('lodash');
const assembleDatapointsConfigKeys = ['attributes', 'datapoints_config', 'is_enabled', 'source_type', 'station_ids'];
const initDerivedDatastreamKeys = ['derivation_method', 'derived_from_datastream_ids', 'is_enabled', 'source_type'];
const processDatastreamKeys = ['datapoints_config_built', 'datapoints_config_refd'];
const defaultsMigrations = rec => {
  let terms = {};

  // Convert 1.x tags array to 2.x terms object
  if (Array.isArray(rec.tags)) {
    terms = rec.tags.reduce((obj, tag) => {
      const parts = tag.split('_');
      const value = parts.pop();
      if (parts.length) {
        _.set(obj, parts.join('.'), value);
      } else {
        obj[value] = true;
      }
      return obj;
    }, {});
  }
  _.defaults(rec, {
    is_enabled: rec.enabled,
    terms
  }, {
    is_enabled: true,
    is_geo_protected: false,
    is_hidden: false,
    state: 'ready'
  });
  delete rec.access_levels_resolved;
  delete rec.attributes_info;
  delete rec.convertible_to_uoms;
  delete rec.enabled;
  delete rec.general_config_resolved;
  delete rec.members;
  delete rec.organization_lookup;
  delete rec.preferred_uoms;
  delete rec.station_lookup;
  delete rec.tags;
  delete rec.tags_info;
  delete rec.terms_info;
  delete rec.uom;
  delete rec.urls;
};
const dispatchAnnotationBuild = method => {
  return async context => {
    context.app.logger.debug('dispatchAnnotationBuild');
    const connection = context.app.get('connections').annotationDispatch;
    if (!(connection && method)) return context;
    const now = new Date();
    const datastream = context.result;
    const {
      _id: id
    } = datastream;
    await connection.app.service('annotation-builds').create({
      _id: `${method}-${id}-${now.getTime()}-${idRandom()}`,
      method,
      dispatch_at: now,
      dispatch_key: id,
      expires_at: new Date(now.getTime() + 86400000),
      // 24 hours from now
      spec: {
        datastream
      }
    });
    return context;
  };
};
const dispatchDerivedBuild = method => {
  return async context => {
    context.app.logger.debug('dispatchDerivedBuild');
    const connection = context.app.get('connections').derivedDispatch;
    if (!(connection && method)) return context;
    const now = new Date();
    const datastream = context.result;
    const {
      _id: id
    } = datastream;
    await connection.app.service('derived-builds').create({
      _id: `${method}-${id}-${now.getTime()}-${idRandom()}`,
      method,
      dispatch_at: now,
      dispatch_key: id,
      expires_at: new Date(now.getTime() + 86400000),
      // 24 hours from now
      spec: {
        datastream
      }
    });
    return context;
  };
};
const setExtent = async context => {
  const data = context.method === 'patch' ? context.data.$set : context.data;
  if (!(data && data.datapoints_config_built)) return context;
  const config = mergeConfig(data.datapoints_config_built);
  if (config.length) data.extent = {
    begins_at: new Date(config[0].beginsAt),
    ends_before: new Date(config[config.length - 1].endsBefore)
  };
  return context;
};
const setTermsInfo = async context => {
  const data = context.method === 'patch' ? context.data.$set : context.data;
  if (!(data && data.terms)) return context;
  const {
    terms
  } = data;
  const schemeIds = Object.keys(terms).sort();
  const info = data.terms_info = {
    class_keys: [],
    class_tags: []
  };

  // TODO: Implement caching
  const vocabularies = await context.app.service('vocabularies').find({
    paginate: false,
    provider: null,
    query: {
      is_enabled: true,
      scheme_id: {
        $in: schemeIds
      }
    }
  });
  schemeIds.forEach(schemeId => {
    const keys = [schemeId];
    const spec = terms[schemeId];
    Object.keys(spec).sort().forEach(vLabel => {
      const tLabel = spec[vLabel];
      const vocabulary = vocabularies.find(v => v.scheme_id === schemeId && v.label === vLabel);
      if (!vocabulary) throw new errors.BadRequest(`No vocabulary found for '${schemeId}.${vLabel}'.`);
      const term = vocabulary.terms.find(t => t.label === tLabel);
      if (!term) throw new errors.BadRequest(`No vocabulary term found for '${schemeId}.${vLabel}.${tLabel}'.`);
      const key = `${vLabel}_${tLabel}`;
      const tag = `${schemeId}_${key}`;
      switch (vocabulary.vocabulary_type) {
        case 'class':
          info.class_tags.push(tag);
          keys.push(key);
          break;
        case 'unit':
          if (info.unit_tag) throw new errors.BadRequest(`You are not allowed to specify more than one unit term.`);
          info.unit_tag = tag;
          break;
      }
    });
    if (keys.length > 1) info.class_keys.push(keys.join('__'));
  });
  return context;
};
const stages = [{
  $lookup: {
    from: 'organizations',
    localField: 'organization_id',
    foreignField: '_id',
    as: 'organization'
  }
}, {
  $unwind: {
    path: '$organization',
    preserveNullAndEmptyArrays: true
  }
}, {
  $lookup: {
    from: 'stations',
    localField: 'station_id',
    foreignField: '_id',
    as: 'station'
  }
}, {
  $unwind: {
    path: '$station',
    preserveNullAndEmptyArrays: true
  }
}, {
  $addFields: {
    access_levels_resolved: {
      $mergeObjects: [{
        member_level: Visibility.DOWNLOAD,
        public_level: Visibility.DOWNLOAD
      }, '$organization.access_levels', '$station.access_levels', '$access_levels']
    },
    general_config_resolved: {
      $mergeObjects: [{}, '$organization.general_config', '$station.general_config', '$general_config']
    },
    organization_lookup: {
      name: '$organization.name',
      slug: '$organization.slug'
    },
    station_lookup: {
      name: '$station.name',
      slug: '$station.slug',
      time_zone: '$station.time_zone',
      utc_offset: '$station.utc_offset'
    }
  }
}];
exports.before = {
  // all: [],

  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages.concat({
    $project: {
      datapoints_config_built: false,
      datapoints_config_refd: false,
      organization: false,
      station: false
    }
  }))],
  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages.concat({
    $project: {
      organization: false,
      station: false
    }
  }))],
  create: [globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'datastream.create.json',
    versionStamp: true
  }), setExtent, setTermsInfo],
  update: [globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'datastream.update.json',
    versionStamp: true
  }), setExtent, setTermsInfo],
  patch: [globalHooks.beforePatch({
    schemaName: 'datastream.patch.json',
    versionStamp: true
  }), setExtent, setTermsInfo],
  remove: globalHooks.beforeRemove()
};
exports.after = {
  // all: [],
  // find: [],
  // get: [],

  create: [iff(context => context.result.source_type === 'sensor', dispatchAnnotationBuild('assembleDatapointsConfig')), iff(context => context.result.source_type === 'sensor', dispatchDerivedBuild('processDatastream')), iff(context => context.result.source_type === 'deriver', dispatchDerivedBuild('initDerivedDatastream')), globalHooks.signalBackend()],
  update: [iff(context => context.result.source_type === 'sensor', dispatchAnnotationBuild('assembleDatapointsConfig')), iff(context => context.result.source_type === 'sensor', dispatchDerivedBuild('processDatastream')), iff(context => context.result.source_type === 'deriver', dispatchDerivedBuild('initDerivedDatastream')), globalHooks.signalBackend()],
  patch: [iff(({
    data,
    params,
    result
  }) => result.source_type === 'sensor' && params.dispatchAnnotationBuild !== false && (params.dispatchAnnotationBuild === true || data.$set && _.intersection(assembleDatapointsConfigKeys, Object.keys(data.$set)).length || data.$unset && _.intersection(assembleDatapointsConfigKeys, Object.keys(data.$unset)).length), dispatchAnnotationBuild('assembleDatapointsConfig')), iff(({
    data,
    params,
    result
  }) => result.source_type === 'sensor' && params.dispatchDerivedBuild !== false && (params.dispatchDerivedBuild === true || data.$set && _.intersection(processDatastreamKeys, Object.keys(data.$set)).length || data.$unset && _.intersection(processDatastreamKeys, Object.keys(data.$unset)).length), dispatchDerivedBuild('processDatastream')), iff(({
    data,
    params,
    result
  }) => result.source_type === 'deriver' && params.dispatchDerivedBuild !== false && (params.dispatchDerivedBuild === true || data.$set && _.intersection(initDerivedDatastreamKeys, Object.keys(data.$set)).length || data.$unset && _.intersection(initDerivedDatastreamKeys, Object.keys(data.$unset)).length), dispatchDerivedBuild('initDerivedDatastream')), globalHooks.signalBackend()],
  remove: [iff(context => context.result.source_type === 'sensor', dispatchDerivedBuild('processDatastream')), iff(context => context.result.source_type === 'deriver', dispatchDerivedBuild('destroyDerivedDatastream')), globalHooks.signalBackend()]
};