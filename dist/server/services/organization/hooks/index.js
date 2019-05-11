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
    is_enabled: true,
    sort_value: 0
  });

  delete rec.enabled;
};

const stages = [{
  $addFields: {
    access_levels_resolved: {
      $mergeObjects: [{
        member_level: Visibility.DOWNLOAD,
        public_level: Visibility.DOWNLOAD
      }, '$access_levels']
    }
  }
}];
exports.before = {
  // all: [],
  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],
  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],
  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'organization.create.json'
  }),
  update: [globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'organization.update.json'
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
    schemaName: 'organization.patch.json'
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