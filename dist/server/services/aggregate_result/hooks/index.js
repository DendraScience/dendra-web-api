'use strict';

const commonHooks = require('feathers-hooks-common');

exports.before = {
  // all: [],

  find: commonHooks.disallow(),

  // get: [],

  create: commonHooks.disallow(),
  update: commonHooks.disallow(),
  patch: commonHooks.disallow(),
  remove: commonHooks.disallow()
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