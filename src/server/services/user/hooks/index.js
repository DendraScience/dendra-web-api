const globalHooks = require('../../../hooks')
const local = require('@feathersjs/authentication-local')

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
        if (!data.password) data.password = params.before.password
        data.created_at = params.before.created_at
        data.created_by = params.before.created_by
      }
    }
  ],

  patch: [
    local.hooks.hashPassword(),
    globalHooks.beforePatch('user.patch.json')
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
