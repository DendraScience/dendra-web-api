const bcrypt = require('bcryptjs')
const errors = require('@feathersjs/errors')
const globalHooks = require('../../../hooks')
const local = require('@feathersjs/authentication-local')
const { discard, getByDot } = require('feathers-hooks-common')

const PATCH_CURRENT_PASSWORD = '$set.current_password'
const PATCH_PASSWORD = '$set.password'

exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),

  get: globalHooks.beforeGet(),

  create: [
    local.hooks.hashPassword(),
    globalHooks.beforeCreate('user.create.json')
  ],

  update: [
    local.hooks.hashPassword(),
    globalHooks.beforeUpdate('user.update.json'),

    ({ data, params }) => {
      if (params.before) {
        data.created_at = params.before.created_at
        data.created_by = params.before.created_by
      }
    }
  ],

  patch: [
    // local.hooks.hashPassword({ passwordField: PATCH_CURRENT_PASSWORD }),
    local.hooks.hashPassword({ passwordField: PATCH_PASSWORD }),

    ({ data, params }) => {
      params.currentPassword = getByDot(data, PATCH_CURRENT_PASSWORD)
    },
    discard(PATCH_CURRENT_PASSWORD),

    globalHooks.beforePatch('user.patch.json'),

    async ({ data, params }) => {
      const newPassword = getByDot(data, PATCH_PASSWORD)

      if (
        newPassword &&
        !(await bcrypt.compare(params.currentPassword, params.before.password))
      ) {
        throw new errors.Forbidden('The current password is not valid.')
      }
    }
  ],

  remove: globalHooks.beforeRemove()
}

exports.after = {
  all: local.hooks.protect('password')

  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
