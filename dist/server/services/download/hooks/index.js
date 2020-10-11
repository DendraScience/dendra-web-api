"use strict";

const globalHooks = require('../../../hooks');

exports.before = {
  // all: [],
  find: globalHooks.beforeFind(),
  get: globalHooks.beforeGet(),
  create: globalHooks.beforeCreate({
    schemaName: 'download.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    schemaName: 'download.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'download.patch.json',
    versionStamp: true
  }),
  remove: globalHooks.beforeRemove()
};
exports.after = {
  // all: [],
  // find: [],
  // get: [],
  create: globalHooks.signalBackend(),
  update: globalHooks.signalBackend(),
  patch: globalHooks.signalBackend(),
  remove: globalHooks.signalBackend()
};