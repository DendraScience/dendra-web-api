const errors = require('@feathersjs/errors')
const {sorter, select, filterQuery} = require('@feathersjs/commons')
const sift = require('sift')

const fs = require('fs')
const path = require('path')
const util = require('util')
const readFile = util.promisify(fs.readFile)

const hooks = require('./hooks')

class Service {
  constructor (options = {}) {
    this.paginate = options.paginate || {}
    this.id = options.id || '_id'
    this._matcher = options.matcher
    this._sorter = options.sorter || sorter
  }

  setup (app) {
    this.app = app
  }

  find (params, getFilter = filterQuery) {
    const {query, filters} = getFilter(params.query || {})
    const map = select(params)

    const names = this.app.get('schemaNames')

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
    const schemaPath = this.app.get('schemaPath')
    const names = this.app.get('schemaNames')

    if (names.indexOf(id) > -1) {
      return readFile(path.join(schemaPath, id), 'utf8').then(data => {
        return {
          [this.id]: id,
          content: JSON.parse(data)
        }
      })
    }

    return Promise.reject(
      new errors.NotFound(`No record found for id '${id}'`)
    )
  }
}

module.exports = function (app) {
  app.use('/system/schemas', new Service())

  // Get the wrapped service object, bind hooks
  const schemaService = app.service('/system/schemas')

  schemaService.hooks(hooks)
}
