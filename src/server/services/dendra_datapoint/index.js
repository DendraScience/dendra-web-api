const errors = require('@feathersjs/errors')
const hooks = require('./hooks')

/**
 * Custom service that submits a Dendra datapoints find using query parameters:
 *
 *   datastream_ids - a list of datastream ids to fetch datapoints (required)
 *   t_int - query parameter passed down to datapoints calls
 *   t_local - query parameter passed down to datapoints calls
 *   time[$op] - casted time object with operators $gt, $gte, $lt and $lte (optional)
 *   $sort[time] - pass (-1) to return the most recent timestamps first
 *   $limit - return the first N points
 */
class Service {
  setup(app) {
    this.app = app
  }

  async find(params) {
    const query = params.query || {}
    const { $sort: sort, $limit: limit } = query

    let { datastream_ids: ids } = query
    if (!ids)
      throw new errors.GeneralError(
        'Dendra datapoints requries query.datastream_ids.'
      )
    if (!Array.isArray(ids)) ids = [ids]

    const result = new Array(ids.length).fill(null)
    const datapointsService = this.app.service('datapoints')
    const datapointsQuery = {}

    if (query.time !== undefined) datapointsQuery.time = query.time
    datapointsQuery.$sort = {
      time: sort && sort.time === -1 ? -1 : 1
    }
    if (limit !== undefined) datapointsQuery.$limit = limit
    if (query.t_int) datapointsQuery.t_int = query.t_int
    if (query.t_local) datapointsQuery.t_local = query.t_local

    await Promise.all(
      ids.map((id, index) =>
        datapointsService
          .find({
            query: Object.assign(
              {
                datastream_id: id
              },
              datapointsQuery
            ),
            queryDepth: params.queryDepth // Passthrough to limit recursion
          })
          .then(res => (result[index] = res))
      )
    )

    return result
  }
}

module.exports = function (app) {
  app.use('/dendra/datapoints', new Service())

  // Get the wrapped service object, bind hooks
  app.service('dendra/datapoints').hooks(hooks)
}
