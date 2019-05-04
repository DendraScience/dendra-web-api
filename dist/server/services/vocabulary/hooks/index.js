"use strict";

const globalHooks = require('../../../hooks');

const _ = require('lodash');

const defaultsMigrations = rec => {
  _.defaults(rec, {
    is_enabled: rec.enabled,
    vocabulary_type: rec.label === 'Unit' ? 'unit' : 'class'
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
    schemaName: 'vocabulary.create.json'
  }),
  update: [globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'vocabulary.update.json'
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
    schemaName: 'vocabulary.patch.json'
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