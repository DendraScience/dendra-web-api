import filter from 'feathers-query-filters'
import {errors} from 'feathers-errors'
import hooks from './hooks'
import request from 'request'

/**
 * Low-level service to retrieve Influx points.
 *
 * Since this sits behind another service; we're less fussy about santizing parameters.
 */
class Service {
  constructor (options) {
    this.apis = options.apis
    this.paginate = options.paginate || {}
  }

  _find (params, getFilter = filter) {
    const {query, filters} = getFilter(params.query || {})
    const api = this.apis[query.api] || this.apis.default
    const influxUrl = api && api.url
    const parts = [
      `SELECT ${typeof query.sc === 'string' ? query.sc : '*'}`,
      `FROM ${typeof query.fc === 'string' ? query.fc : 'logger_data'}`
    ]

    if (typeof query.wc === 'string') parts.push(`WHERE ${query.wc}`)
    if (typeof query.gbc === 'string') parts.push(`GROUP BY ${query.gbc}`)
    if (filters.$sort && filters.$sort.time && (filters.$sort.time === -1)) parts.push('ORDER BY time DESC')
    if (typeof filters.$limit !== 'undefined') parts.push(`LIMIT ${filters.$limit}`)

    // Limited to only one series for now
    parts.push('SLIMIT 1')

    const requestOpts = {
      method: 'GET',
      qs: {
        db: query.db,
        q: parts.join(' ')
      },
      url: `${influxUrl}/query`
    }

    return new Promise((resolve, reject) => {
      request(requestOpts, (err, response) => err ? reject(err) : resolve(response))
    }).then(response => {
      if (response.statusCode !== 200) throw new errors.BadRequest(`Non-success status code ${response.statusCode}`)

      return JSON.parse(response.body)
    }).then(body => {
      // Stay async-friendly
      return new Promise((resolve, reject) => {
        setImmediate(() => {
          if (!body) {
            return reject(new errors.BadRequest('No body returned'))
          }
          if (body.error) {
            return reject(new errors.BadRequest('Error returned', {
              error: body.error
            }))
          }

          const firstResult = body.results && body.results[0]

          if (!firstResult) {
            return reject(new errors.BadRequest('No result returned'))
          }
          if (firstResult.error) {
            return reject(new errors.BadRequest('Error result returned', {
              error: firstResult.error
            }))
          }

          resolve({
            limit: filters.$limit,
            data: firstResult
          })
        })
      })
    })
  }

  find (params) {
    const paginate = typeof params.paginate !== 'undefined' ? params.paginate : this.paginate
    const result = this._find(params, query => filter(query, paginate))

    if (!(paginate && paginate.default)) {
      return result.then(page => page.data)
    }

    return result
  }
}

module.exports = (function () {
  return function () {
    const app = this
    const services = app.get('services')

    if (services.influx_select) {
      app.use('/influx/select', new Service({
        apis: services.influx_select.apis,
        paginate: services.influx_select.paginate
      }))

      // Get the wrapped service object, bind hooks
      const selectService = app.service('/influx/select')

      selectService.before(hooks.before)
      selectService.after(hooks.after)
    }
  }
})()
