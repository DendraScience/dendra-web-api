'use strict';

// const apiHooks = require('@dendra-science/api-hooks-common')
// const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common');
const { errors } = require('feathers-errors');

exports.before = {
  // all: [],
  // find: [],

  get: [hook => {
    // TODO: Move this to _get in service?
    if (hook.app.get('schemaNames').indexOf(hook.id) === -1) {
      throw new errors.NotFound('Page not found');
    }
  }],

  create: hooks.disallow(),
  update: hooks.disallow(),
  patch: hooks.disallow(),
  remove: hooks.disallow()
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