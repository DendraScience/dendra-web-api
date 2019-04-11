const ajv = require('../lib/ajv')()
const apiHooks = require('@dendra-science/api-hooks-common')
const auth = require('@feathersjs/authentication')
const { combine, discard, validateSchema } = require('feathers-hooks-common')

const restrictToAbility = require('./restrictToAbility')
const setAbility = require('./setAbility')

module.exports = schemaName => {
  return async context => {
    const newContext = await combine(
      auth.hooks.authenticate('jwt'),
      discard('created_at', 'created_by', 'updated_at', 'updated_by'),
      validateSchema(schemaName, ajv),
      setAbility(),
      restrictToAbility(),
      apiHooks.timestamp(),
      apiHooks.userstamp(),
      apiHooks.coerce()
    ).call(this, context)

    return newContext
  }
}
