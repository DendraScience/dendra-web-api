'use strict';

const apiHooks = require('@dendra-science/api-hooks-common');
const auth = require('feathers-authentication');
const authHooks = require('feathers-authentication-hooks');
const commonHooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');

const SCHEMA_NAME = 'thing.json';

exports.before = {
  // all: [],

  find: [apiHooks.coerceQuery()],

  // get: [],

  create: [auth.hooks.authenticate('jwt'), authHooks.restrictToRoles({
    roles: ['sys-admin']
  }), globalHooks.validate(SCHEMA_NAME), apiHooks.timestamp(), apiHooks.coerce()],

  update: [auth.hooks.authenticate('jwt'), authHooks.restrictToRoles({
    roles: ['sys-admin']
  }), globalHooks.validate(SCHEMA_NAME), apiHooks.timestamp(), apiHooks.coerce(), hook => {
    // TODO: Optimize with find/$select to return fewer fields?
    return hook.app.service('/things').get(hook.id).then(doc => {
      hook.data.created_at = doc.created_at;
      return hook;
    });
  }],

  patch: [commonHooks.disallow('rest')],

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