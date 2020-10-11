"use strict";

const globalHooks = require('../../../hooks');

const _ = require('lodash');

const defaultsMigrations = rec => {
  _.defaults(rec, {
    is_enabled: rec.enabled
  }, {
    is_enabled: true
  });

  delete rec.enabled;
};

exports.before = {
  // all: [],
  find: globalHooks.beforeFind(),
  get: globalHooks.beforeGet(),
  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'place.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'place.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'place.patch.json',
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