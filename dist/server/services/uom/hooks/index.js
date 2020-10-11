"use strict";

const globalHooks = require('../../../hooks');

exports.before = {
  // all: [],
  find: globalHooks.beforeFind(),
  get: globalHooks.beforeGet(),
  create: globalHooks.beforeCreate({
    schemaName: 'uom.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    schemaName: 'uom.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'uom.patch.json',
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