"use strict";

const globalHooks = require('../../../hooks');
exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),
  get: globalHooks.beforeGet(),
  create: globalHooks.beforeCreate({
    schemaName: 'membership.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    schemaName: 'membership.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'membership.patch.json',
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