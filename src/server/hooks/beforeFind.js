const apiHooks = require('@dendra-science/api-hooks-common')
const auth = require('@feathersjs/authentication')
const { combine, iff } = require('feathers-hooks-common')

const restrictQueryToAbility = require('./restrictQueryToAbility')
const setAbility = require('./setAbility')

module.exports = () => {
  return async context => {
    const newContext = await combine(
      iff(
        context =>
          context.params.headers && context.params.headers.authorization,
        auth.hooks.authenticate('jwt')
      ),
      setAbility(),
      restrictQueryToAbility(),
      apiHooks.coerceQuery()
    ).call(this, context)

    return newContext
  }
}
