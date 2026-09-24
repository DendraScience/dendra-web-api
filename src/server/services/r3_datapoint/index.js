const errors = require('@feathersjs/errors')
const Agent = require('agentkeepalive')
const { HttpsAgent } = require('agentkeepalive')
const axios = require('axios')
const qs = require('qs')
const { treeMap } = require('@dendra-science/utils')
const instance = axios.create({
  httpAgent: new Agent({
    timeout: 60000,
    freeSocketTimeout: 30000
  }),
  httpsAgent: new HttpsAgent({
    timeout: 60000,
    freeSocketTimeout: 30000
  }),
  maxRedirects: 0,
  timeout: 180000
})
const hooks = require('./hooks')

const silentLogger = {
  debug() {},
  warn() {}
}

/**
 * Local timeseries service that GETs one table window from R3
 * GET {url}/datapoints (cluster-internal Feathers facade).
 *
 *   organization_id - required
 *   table_id - required
 *   mappings[] - at least one { input_name }
 *   time[$op] - $gt, $gte, $lt, $lte
 *   $sort[time] - pass (-1) for descending
 *   $limit - first N points
 *   t_int, t_local, utc_offset - compact encoding (handled by R3)
 */
class Service {
  constructor(options) {
    options = options || {}
    this.url = options.url
    this.http = options.http || instance
    this.logger = options.logger || silentLogger
  }

  setup(app) {
    this.app = app
    this.logger = app.logger
  }

  async find(params) {
    const query = params.query || {}
    const mappings = mappingList(query.mappings)

    if (!this.url) throw new errors.GeneralError('R3 datapoints URL undefined.')
    if (!query.organization_id)
      throw new errors.BadRequest(
        'R3 datapoints requires query.organization_id.'
      )
    if (!query.table_id)
      throw new errors.BadRequest('R3 datapoints requires query.table_id.')
    if (!mappings.length)
      throw new errors.BadRequest(
        'R3 datapoints requires at least one mapping.'
      )

    const isoQuery = treeMap(query, obj => {
      if (obj instanceof Date) return obj.toISOString()
      return obj
    })
    const queryUrl = `${this.url}/datapoints`
    const queryConfig = {
      params: isoQuery,
      paramsSerializer: q => qs.stringify(q, { encodeValuesOnly: true })
    }

    this.logger.debug(`GET ${queryUrl}`)

    let response
    try {
      response = await this.http.get(queryUrl, queryConfig)
    } catch (err) {
      // Retry in case of keep-alive race
      // SEE: https://github.com/node-modules/agentkeepalive#support-reqreusedsocket
      if (
        err.request &&
        err.request.reusedSocket &&
        err.code === 'ECONNRESET'
      ) {
        this.logger.warn(`ECONNRESET retrying GET ${queryUrl}`)
        try {
          response = await this.http.get(queryUrl, queryConfig)
        } catch (retryErr) {
          throwR3Error(retryErr)
        }
      } else throwR3Error(err)
    }

    if (response.status !== 200)
      throw new errors.BadRequest(`Non-success status code ${response.status}`)

    const body = response.data

    if (!Array.isArray(body))
      throw new errors.GeneralError('R3 datapoints response is not an array')

    return body
  }
}

function mappingList(mappings) {
  if (Array.isArray(mappings)) return mappings.filter(Boolean)
  if (mappings && typeof mappings === 'object') {
    return Object.keys(mappings)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => mappings[key])
      .filter(Boolean)
  }
  return []
}

function throwR3Error(err) {
  const res = err && err.response
  if (!res) {
    throw new errors.GeneralError(
      (err && err.message) || 'R3 datapoints request failed'
    )
  }

  const data = res.data || {}
  const message = data.message || `R3 datapoints status ${res.status}`
  const Ctor =
    (data.name && errors[data.name]) ||
    (res.status === 400 && errors.BadRequest) ||
    (res.status === 404 && errors.NotFound) ||
    errors.GeneralError

  throw new Ctor(message)
}

function configure(app) {
  const services = app.get('services') || {}
  const options = services.r3_datapoint || {}

  app.use(
    '/r3/datapoints',
    new Service({
      url: options.url
    })
  )

  app.service('r3/datapoints').hooks(hooks)
}

configure.Service = Service
module.exports = configure
