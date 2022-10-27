"use strict";

const apiHooks = require('@dendra-science/api-hooks-common');
const {
  disallow
} = require('feathers-hooks-common');
exports.before = {
  // all: [],

  find: apiHooks.coerceQuery(),
  get: apiHooks.coerceQuery(),
  create: disallow(),
  update: disallow(),
  patch: disallow(),
  remove: disallow()
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