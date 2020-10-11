const globalHooks = require('../../../hooks')
const { iff } = require('feathers-hooks-common')
const { idRandom } = require('../../../lib/utils')
const _ = require('lodash')

const processUploadKeys = ['spec']

const dispatchFileImport = method => {
  return async context => {
    const connection = context.app.get('connections').fileDispatch

    if (!(connection && method)) return context

    const now = new Date()
    const upload = context.result
    const { _id: id } = upload

    await connection.app.service('file-imports').create({
      _id: `${method}-${id}-${now.getTime()}-${idRandom()}`,
      method,
      dispatch_at: now,
      dispatch_key: id,
      expires_at: new Date(now.getTime() + 86400000), // 24 hours from now
      spec: {
        upload
      }
    })

    return context
  }
}

exports.before = {
  // all: [],

  find: globalHooks.beforeFind(),

  get: globalHooks.beforeGet(),

  create: globalHooks.beforeCreate({
    schemaName: 'upload.create.json',
    versionStamp: true
  }),

  update: globalHooks.beforeUpdate({
    schemaName: 'upload.update.json',
    versionStamp: true
  }),

  patch: globalHooks.beforePatch({
    schemaName: 'upload.patch.json',
    versionStamp: true
  }),

  remove: globalHooks.beforeRemove()
}

exports.after = {
  // all: [],
  // find: [],
  // get: [],

  create: [dispatchFileImport('processUpload'), globalHooks.signalBackend()],

  update: [dispatchFileImport('processUpload'), globalHooks.signalBackend()],

  patch: [
    iff(
      ({ data }) =>
        (data.$set &&
          _.intersection(processUploadKeys, Object.keys(data.$set)).length) ||
        (data.$unset &&
          _.intersection(processUploadKeys, Object.keys(data.$unset)).length),
      dispatchFileImport('processUpload')
    ),

    globalHooks.signalBackend()
  ],

  remove: globalHooks.signalBackend()
}
