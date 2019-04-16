"use strict";

const globalHooks = require('../../../hooks');

const stages = [{
  $addFields: {
    access_levels_resolved: {
      $mergeObjects: [{
        member_level: 1,
        public_level: 1
      }, '$access_levels']
    }
  }
}];
exports.before = {
  // all: [],
  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],
  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],
  create: globalHooks.beforeCreate('organization.create.json'),
  update: [globalHooks.beforeUpdate('organization.update.json'), ({
    data,
    params
  }) => {
    if (params.before) {
      data.created_at = params.before.created_at;
      data.created_by = params.before.created_by;
    }
  }],
  patch: globalHooks.beforePatch('organization.patch.json'),
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