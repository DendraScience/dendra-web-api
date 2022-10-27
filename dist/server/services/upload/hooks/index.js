"use strict";

const globalHooks = require('../../../hooks');
const _ = require('lodash');
const defaultsMigrations = rec => {
  _.defaults(rec, {
    state: 'pending'
  });
  delete rec.result;
  delete rec.result_pre;
  delete rec.result_post;
};
exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),
  get: globalHooks.beforeGet(),
  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'upload.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'upload.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'upload.patch.json',
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