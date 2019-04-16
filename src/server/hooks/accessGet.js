const errors = require('@feathersjs/errors')
const { select } = require('@feathersjs/adapter-commons')
const { toMongoQuery } = require('@casl/mongoose')

/**
 * Performs a service get method restricted by access ability rules.
 *
 * SEE:
 * https://stalniy.github.io/casl/abilities/database/integration/2017/07/22/database-integration.html
 * https://github.com/feathersjs-ecosystem/feathers-mongodb/blob/master/lib/index.js
 * https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/
 */
module.exports = (stages = []) => {
  return async context => {
    if (context.type !== 'before') {
      throw new Error(
        "The 'accessGet' hook should only be used as a 'before' hook."
      )
    }

    if (!context.params.provider) return context

    const { params, service, path: serviceName } = context
    const { ability } = params

    if (!ability) {
      throw new Error("The 'accessGet' hook requires params.ability.")
    }

    const accessQuery = toMongoQuery(ability, serviceName, 'access')
    if (accessQuery === null) {
      throw new errors.NotFound(`No record found for id '${context.id}'`)
    }

    const { query } = service.filterQuery(params)

    /*
      Construct aggregation pipeline.
     */

    query.$and = (query.$and || []).concat({
      [service.id]: service._objectifyId(context.id)
    })

    const pipeline = [{ $match: query }, ...stages]

    if (accessQuery) pipeline.push({ $match: accessQuery })

    pipeline.push({ $limit: 1 })

    const options = {
      allowDiskUse: true
    }

    const result = await service.Model.aggregate(pipeline, options).toArray()

    if (!result.length) {
      throw new errors.NotFound(`No record found for id '${context.id}'`)
    }

    context.result = select(params, service.id)(result[0])

    return context
  }
}
