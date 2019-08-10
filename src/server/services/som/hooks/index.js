const globalHooks = require('../../../hooks')

exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),

  get: globalHooks.beforeGet(),

  create: globalHooks.beforeCreate({
    schemaName: 'som.create.json',
    versionStamp: true
  }),

  update: [
    globalHooks.beforeUpdate({
      schemaName: 'som.update.json',
      versionStamp: true
    }),

    ({ data, params }) => {
      if (params.before) {
        data.created_at = params.before.created_at
        data.created_by = params.before.created_by
      }
    }
  ],

  patch: globalHooks.beforePatch({
    schemaName: 'som.patch.json',
    versionStamp: true
  }),

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
