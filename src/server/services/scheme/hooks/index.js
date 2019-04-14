const globalHooks = require('../../../hooks')

exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),

  get: globalHooks.beforeGet(),

  create: globalHooks.beforeCreate('scheme.create.json'),

  update: [
    globalHooks.beforeUpdate('scheme.update.json'),

    ({ data, params }) => {
      if (params.before) {
        data.created_at = params.before.created_at
        data.created_by = params.before.created_by
      }
    }
  ],

  patch: globalHooks.beforePatch('scheme.patch.json'),

  remove: globalHooks.beforeRemove()
}

exports.after = {
  // all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
