"use strict";

const globalHooks = require('../../../hooks');

const _ = require('lodash');

const defaultsMigrations = rec => {
  let terms; // Convert 1.x tags array to 2.x terms object

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

  delete rec.attributes_info;
  delete rec.convertible_to_uoms;
  delete rec.enabled;
  delete rec.members;
  delete rec.preferred_uoms;
  delete rec.tags;
  delete rec.tags_info;
  delete rec.uom;
  delete rec.urls;
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
        member_level: 1,
        public_level: 1
      }, '$organization.access_levels', '$station.access_levels', '$access_levels']
    }
  }
}];
exports.before = {
  // all: [],
  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],
  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],
  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'datastream.create.json',
    versionStamp: true
  }),
  update: [globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'datastream.update.json',
    versionStamp: true
  }), ({
    data,
    params
  }) => {
    if (params.before) {
      data.created_at = params.before.created_at;
      data.created_by = params.before.created_by;
    }
  }],
  patch: globalHooks.beforePatch({
    schemaName: 'datastream.patch.json',
    versionStamp: true
  }),
  remove: globalHooks.beforeRemove()
};
exports.after = {// all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
};