const errors = require('@feathersjs/errors')
const { toMongoQuery } = require('@casl/mongoose')

module.exports = () => {
  return async context => {
    if (context.type !== 'before') {
      throw new Error(
        "The 'restrictQueryToAbility' hook should only be used as a 'before' hook."
      )
    }

    if (!context.params.provider) return context

    const { method: action, params, path: serviceName } = context
    const { ability } = params

    if (!ability) {
      throw new Error(
        "The 'restrictQueryToAbility' hook requires params.ability."
      )
    }

    const query = toMongoQuery(ability, serviceName, action)

    if (!params.query) params.query = {}

    if (query !== null) {
      params.query.$and = (params.query.$and || []).concat(query)
    } else if (action === 'find') {
      params.query.$limit = 0
    } else {
      throw new errors.NotFound(`No record found for id '${context.id}'.`)
    }

    return context
  }
}
