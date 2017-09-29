'use strict';

// const apiHooks = require('@dendra-science/api-hooks-common')
// const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common');
// const {errors} = require('feathers-errors')

exports.before = {
  // all: [],

  find: hooks.disallow(),

  // get: [],

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