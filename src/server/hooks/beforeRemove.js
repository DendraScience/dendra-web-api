const apiHooks = require('@dendra-science/api-hooks-common')
const auth = require('@feathersjs/authentication')
const { combine } = require('feathers-hooks-common')

const restrictToAbility = require('./restrictToAbility')
const setAbility = require('./setAbility')

module.exports = () => {
  return async context => {
    const newContext = await combine(
      auth.hooks.authenticate('jwt'),
      setAbility(),
      restrictToAbility(),
      apiHooks.coerceQuery()
    ).call(this, context)

    return newContext
  }
}
