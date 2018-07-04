const apiHooks = require('@dendra-science/api-hooks-common')
const auth = require('feathers-authentication')
const authHooks = require('feathers-authentication-hooks')
const commonHooks = require('feathers-hooks-common')
const globalHooks = require('../../../hooks')
const local = require('feathers-authentication-local')

const SCHEMA_NAME = 'user.json'

exports.before = {
  // all: [],

  find: [
    auth.hooks.authenticate('jwt'),
    authHooks.restrictToRoles({
      roles: ['sys-admin']
    }),
    apiHooks.coerceQuery()
  ],

  get: [
    auth.hooks.authenticate('jwt'),
    authHooks.restrictToRoles({
      roles: ['sys-admin'],
      ownerField: '_id',
      owner: true
    })
  ],

  create: [
    globalHooks.validate(SCHEMA_NAME),
    local.hooks.hashPassword(),
    apiHooks.timestamp(),
    apiHooks.coerce()
  ],

  update: [
    auth.hooks.authenticate('jwt'),
    authHooks.restrictToRoles({
      roles: ['sys-admin'],
      ownerField: '_id',
      owner: true
    }),
    globalHooks.validate(SCHEMA_NAME),
    local.hooks.hashPassword(),
    apiHooks.timestamp(),
    apiHooks.coerce(),

    (hook) => {
      // TODO: Optimize with find/$select to return fewer fields?
      return hook.app.service('/users').get(hook.id).then(doc => {
        if (!hook.data.password) hook.data.password = doc.password
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
      roles: ['sys-admin'],
      ownerField: '_id',
      owner: true
    })
  ]
}

exports.after = {
  all: [
    commonHooks.when(hook => hook.params.provider, commonHooks.discard('password'))
  ]

  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
