const commonHooks = require('feathers-hooks-common')
const globalHooks = require('../../../hooks')
const local = require('@feathersjs/authentication-local')

exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),

  get: globalHooks.beforeGet(),

  create: [
    globalHooks.beforeCreate('user.create.json'),
    local.hooks.hashPassword()
  ],

  update: [
    globalHooks.beforeUpdate('user.update.json'),
    local.hooks.hashPassword(),

    ({ data, params }) => {
      if (params.before) {
        if (!data.password) data.password = params.before.password
        data.created_at = params.before.created_at
        data.created_by = params.before.created_by
      }
    }
  ],

  patch: [
    globalHooks.beforePatch('user.patch.json'),
    local.hooks.hashPassword()
  ],

  remove: globalHooks.beforeRemove()
}

exports.after = {
  all: [
    commonHooks.iff(
      context => context.params.provider,
      commonHooks.discard('password')
    )
  ]

  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
