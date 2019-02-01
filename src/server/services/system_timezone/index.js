const errors = require('@feathersjs/errors')
const {sorter, select, filterQuery} = require('@feathersjs/commons')
const sift = require('sift')

const moment = require('moment-timezone')

const hooks = require('./hooks')

class Service {
  constructor (options = {}) {
    this.paginate = options.paginate || {}
    this.id = options.id || '_id'
    this._matcher = options.matcher
    this._sorter = options.sorter || sorter
  }

  find (params, getFilter = filterQuery) {
    const {query, filters} = getFilter(params.query || {})
    const map = select(params)

    const names = moment.tz.names()

    let values = names.map(name => ({[this.id]: name}))

    if (this._matcher) {
      values = values.filter(this._matcher(query))
    } else {
      values = sift(query, values)
    }

    const total = values.length

    if (filters.$sort) {
      values.sort(this._sorter(filters.$sort))
    }

    if (filters.$skip) {
      values = values.slice(filters.$skip)
    }

    if (typeof filters.$limit !== 'undefined') {
      values = values.slice(0, filters.$limit)
    }

    return Promise.resolve({
      total,
      limit: filters.$limit,
      skip: filters.$skip || 0,
      data: map(values)
    })
  }

  get (id) {
    const zone = moment.tz.zone(id)

    if (zone) {
      return Promise.resolve({
        [this.id]: id,
        zone
      })
    }

    return Promise.reject(
      new errors.NotFound(`No record found for id '${id}'`)
    )
  }
}

module.exports = function (app) {
  app.use('/system/timezones', new Service())

  // Get the wrapped service object, bind hooks
  const timezoneService = app.service('/system/timezones')

  timezoneService.hooks(hooks)
}
