const apiHooks = require('@dendra-science/api-hooks-common')
const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
// const {errors} = require('feathers-errors')

const SCHEMA_NAME = 'membership.json'

exports.before = {
  // all: [],

  find: apiHooks.coerceQuery(),

  // get: [],

  create: [
    globalHooks.validate(SCHEMA_NAME),
    apiHooks.timestamp(),
    apiHooks.coerce()
  ],

  update: [
    globalHooks.validate(SCHEMA_NAME),
    apiHooks.timestamp(),
    apiHooks.coerce(),

    (hook) => {
      // TODO: Optimize with find/$select to return fewer fields?
      return hook.app.service('/memberships').get(hook.id).then(doc => {
        hook.data.created_at = doc.created_at
        return hook
      })
    }
  ],

  patch: hooks.disallow('rest')

  // remove: []
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
