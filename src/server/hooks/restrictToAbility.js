const errors = require('@feathersjs/errors')

const { TYPE_KEY } = require('../lib/ability')

module.exports = () => {
  return async context => {
    if (context.type !== 'before') {
      throw new Error(
        "The 'restrictToAbility' hook should only be used as a 'before' hook."
      )
    }

    if (!context.params.provider) return context

    const { method: action, params, path: serviceName, service } = context
    const { ability } = params

    if (!ability) {
      throw new Error("The 'restrictToAbility' hook requires params.ability.")
    }

    if (context.data) {
      context.data[TYPE_KEY] = serviceName

      if (ability.cannot(action, context.data)) {
        throw new errors.Forbidden(
          `You are not allowed to ${action} ${serviceName} using the data`
        )
      }
    }

    if (context.id) {
      const data = await service.get(
        context.id,
        Object.assign({}, params, { provider: null })
      )

      data[TYPE_KEY] = serviceName

      if (ability.cannot(action, data)) {
        throw new errors.Forbidden(
          `You are not allowed to ${action} the existing ${serviceName}`
        )
      }

      params.before = data
    }

    return context
  }
}
