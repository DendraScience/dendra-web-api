"use strict";

const bcrypt = require('bcryptjs');

const errors = require('@feathersjs/errors');

const globalHooks = require('../../../hooks');

const local = require('@feathersjs/authentication-local');

const {
  deleteByDot,
  getByDot
} = require('feathers-hooks-common');

const _ = require('lodash');

const PATCH_CURRENT_PASSWORD = '$set.current_password';
const PATCH_PASSWORD = '$set.password';

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
  create: [local.hooks.hashPassword(), globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'user.create.json'
  })],
  update: [local.hooks.hashPassword(), globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'user.update.json'
  }), ({
    data,
    params
  }) => {
    if (params.before) {
      data.created_at = params.before.created_at;
      data.created_by = params.before.created_by;
    }
  }],
  patch: [local.hooks.hashPassword({
    passwordField: PATCH_PASSWORD
  }), ({
    data,
    params
  }) => {
    params.currentPassword = getByDot(data, PATCH_CURRENT_PASSWORD);
  }, globalHooks.beforePatch({
    alterItems: rec => deleteByDot(rec, PATCH_CURRENT_PASSWORD),
    schemaName: 'user.patch.json'
  }), async ({
    data,
    params
  }) => {
    const newPassword = getByDot(data, PATCH_PASSWORD);

    if (newPassword && !(await bcrypt.compare(params.currentPassword, params.before.password))) {
      throw new errors.Forbidden('The current password is not valid.');
    }
  }],
  remove: globalHooks.beforeRemove()
};
exports.after = {
  all: local.hooks.protect('password') // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []

};