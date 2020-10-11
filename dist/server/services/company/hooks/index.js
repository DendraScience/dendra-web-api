"use strict";

const globalHooks = require('../../../hooks');

exports.before = {
  // all: [],
  find: globalHooks.beforeFind(),
  get: globalHooks.beforeGet(),
  create: globalHooks.beforeCreate({
    schemaName: 'company.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    schemaName: 'company.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'company.patch.json',
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