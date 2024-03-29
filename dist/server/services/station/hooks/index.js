"use strict";

const globalHooks = require('../../../hooks');
const {
  Visibility
} = require('../../../lib/utils');
const _ = require('lodash');
const defaultsMigrations = rec => {
  _.defaults(rec, {
    is_enabled: rec.enabled
  }, {
    is_active: true,
    is_enabled: true,
    is_geo_protected: false,
    is_hidden: false,
    is_stationary: true,
    state: 'ready',
    station_type: 'weather'
  });
  delete rec.access_levels_resolved;
  delete rec.activated_at;
  delete rec.deactivated_at;
  delete rec.enabled;
  delete rec.general_config_resolved;
  delete rec.members;
  delete rec.organization_lookup;
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
  $addFields: {
    access_levels_resolved: {
      $mergeObjects: [{
        member_level: Visibility.DOWNLOAD,
        public_level: Visibility.DOWNLOAD
      }, '$organization.access_levels', '$access_levels']
    },
    general_config_resolved: {
      $mergeObjects: [{}, '$organization.general_config', '$general_config']
    },
    organization_lookup: {
      name: '$organization.name',
      slug: '$organization.slug'
    }
  }
}, {
  $project: {
    organization: false
  }
}];
exports.before = {
  // all: [],

  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],
  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],
  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'station.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'station.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'station.patch.json',
    versionStamp: true
  }),
  remove: globalHooks.beforeRemove()
};
exports.after = {
  // all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
};