const apiHooks = require('@dendra-science/api-hooks-common')
const auth = require('feathers-authentication')
const authHooks = require('feathers-authentication-hooks')
const commonHooks = require('feathers-hooks-common')
const globalHooks = require('../../../hooks')

const SCHEMA_NAME = 'annotation.json'

exports.before = {
  // all: [],

  find: [
    apiHooks.coerceQuery()
  ],

  // get: [],

  create: [
    auth.hooks.authenticate('jwt'),
    authHooks.restrictToRoles({
      roles: ['sys-admin']
    }),
    globalHooks.validate(SCHEMA_NAME),
    apiHooks.timestamp(),
    apiHooks.coerce()
  ],

  update: [
    auth.hooks.authenticate('jwt'),
    authHooks.restrictToRoles({
      roles: ['sys-admin']
    }),
    globalHooks.validate(SCHEMA_NAME),
    apiHooks.timestamp(),
    apiHooks.coerce(),

    (hook) => {
      // TODO: Optimize with find/$select to return fewer fields?
      return hook.app.service('/annotations').get(hook.id).then(doc => {
        hook.beforeDoc = doc
        hook.data.created_at = doc.created_at
        return hook
      })
    }
  ],

  patch: [
    commonHooks.disallow('external')
  ],

  remove: [
    auth.hooks.authenticate('jwt'),
    authHooks.restrictToRoles({
      roles: ['sys-admin']
    })
  ]
}

function createAnnotationBuild () {
  return (hook) => {
    const now = new Date()
    const method = 'processAnnotation'

    return hook.app.get('connections').annotationBuild.app.service('/builds').create({
      _id: `${method}-${hook.result._id}-${now.getTime()}-${Math.floor(Math.random() * 10000)}`,
      method,
      build_at: now,
      expires_at: new Date(now.getTime() + 86400000), // 24 hours from now
      spec: {
        annotation: hook.result,
        annotation_before: hook.beforeDoc || {}
      }
    }).then(() => {
      return hook
    })
  }
}

exports.after = {
  // all: [],
  // find: [],
  // get: [],

  create: [
    createAnnotationBuild()
  ],

  update: [
    createAnnotationBuild()
  ],

  // patch: [],

  remove: [
    createAnnotationBuild()
  ]
}
