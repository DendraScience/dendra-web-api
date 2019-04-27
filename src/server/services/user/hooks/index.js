const errors = require('@feathersjs/errors')
const globalHooks = require('../../../hooks')
const local = require('@feathersjs/authentication-local')
const { discard, getByDot } = require('feathers-hooks-common')

const CURRENT_PASSWORD = 'current_password'

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
    local.hooks.hashPassword(),
    local.hooks.hashPassword(CURRENT_PASSWORD),

    ({ data, params }) => {
      params.currentPassword = getByDot(data, `$set.${CURRENT_PASSWORD}`)
    },
    discard(`$set.${CURRENT_PASSWORD}`),

    globalHooks.beforePatch('user.patch.json'),

    ({ data, params }) => {
      const newPassword = getByDot(data, '$set.password')

      if (newPassword && params.currentPassword !== params.before.password) {
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
