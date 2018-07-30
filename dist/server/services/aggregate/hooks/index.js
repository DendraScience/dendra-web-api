'use strict';

const auth = require('feathers-authentication');
const authHooks = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

const SCHEMA_NAME = 'aggregate.json';

exports.before = {
  // all: [],
  // find [],
  // get: [],

  create: [auth.hooks.authenticate('jwt'), authHooks.restrictToRoles({
    roles: ['sys-admin']
  }), globalHooks.validate(SCHEMA_NAME)],

  update: commonHooks.disallow(),
  patch: commonHooks.disallow(),

  remove: [auth.hooks.authenticate('jwt'), authHooks.restrictToRoles({
    roles: ['sys-admin']
  })]
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