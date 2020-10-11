const ajv = require('../lib/ajv')()
const apiHooks = require('@dendra-science/api-hooks-common')
const auth = require('@feathersjs/authentication')
const {
  alterItems,
  combine,
  discard,
  iff,
  validateSchema
} = require('feathers-hooks-common')

const restrictToAbility = require('./restrictToAbility')
const setAbility = require('./setAbility')
const versionStamp = require('./versionStamp')

module.exports = options => {
  return async context => {
    const newContext = await combine(
      auth.hooks.authenticate('jwt'),
      alterItems(options.alterItems),
      discard(
        '_include',
        'created_at',
        'created_by',
        'datastream',
        'hashes',
        'organization',
        'station',
        'updated_at',
        'updated_by',
        'version_id'
      ),
      validateSchema(options.schemaName, ajv),
      iff(() => options.versionStamp, versionStamp()),
      setAbility(),
      restrictToAbility(),
      apiHooks.timestamp(),
      apiHooks.userstamp(),
      apiHooks.coerce()
    ).call(this, context)

    return newContext
  }
}
