const bcrypt = require('bcryptjs')
const errors = require('@feathersjs/errors')
const globalHooks = require('../../../hooks')
const local = require('@feathersjs/authentication-local')
const _ = require('lodash')

const PATCH_CURRENT_PASSWORD = '$set.current_password'
const PATCH_PASSWORD = '$set.password'

const defaultsMigrations = rec => {
  _.defaults(
    rec,
    {
      is_enabled: rec.enabled
    },
    {
      is_enabled: true
    }
  )

  delete rec.enabled
}

exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),

  get: globalHooks.beforeGet(),

  create: [
    local.hooks.hashPassword(),

    globalHooks.beforeCreate({
      alterItems: defaultsMigrations,
      schemaName: 'user.create.json',
      versionStamp: true
    })
  ],

  update: [
    local.hooks.hashPassword(),

    globalHooks.beforeUpdate({
      alterItems: defaultsMigrations,
      schemaName: 'user.update.json',
      versionStamp: true
    })
  ],

  patch: [
    local.hooks.hashPassword({ passwordField: PATCH_PASSWORD }),

    ({ data, params }) => {
      params.currentPassword = _.get(data, PATCH_CURRENT_PASSWORD)
    },

    globalHooks.beforePatch({
      alterItems: rec => _.unset(rec, PATCH_CURRENT_PASSWORD),
      schemaName: 'user.patch.json',
      versionStamp: true
    }),

    async ({ data, id, params }) => {
      const newPassword = _.get(data, PATCH_PASSWORD)
      const { currentPassword } = params

      if (
        newPassword &&
        params.user &&
        params.user._id &&
        id === `${params.user._id}`
      ) {
        if (!currentPassword)
          throw new errors.BadRequest('The current password is required.')
        else if (
          !(await bcrypt.compare(currentPassword, params.before.password))
        )
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
