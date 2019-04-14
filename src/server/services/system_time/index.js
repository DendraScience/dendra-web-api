const errors = require('@feathersjs/errors')
const { _ } = require('@feathersjs/commons')
const {
  sorter,
  select,
  AdapterService
} = require('@feathersjs/adapter-commons')
const sift = require('sift').default

const _select = (data, ...args) => {
  const base = select(...args)

  // NOTE: Likely not needed
  // return base(JSON.parse(JSON.stringify(data)))
  return base(data)
}

const moment = require('moment-timezone')

const hooks = require('./hooks')

class Service extends AdapterService {
  constructor(options = {}) {
    super(
      _.extend(
        {
          id: '_id',
          matcher: sift,
          sorter
        },
        options
      )
    )
  }

  async _get(id, params = {}) {
    const now = moment().tz(id)

    if (now.tz()) {
      const { query } = this.filterQuery(params)
      const value = {
        [this.id]: id,
        now: now.format()
      }

      if (this.options.matcher(query)(value)) {
        return _select(value, params, this.id)
      }
    }

    throw new errors.NotFound(`No record found for id '${id}'`)
  }
}

module.exports = function(app) {
  app.use('/system/time', new Service())

  // Get the wrapped service object, bind hooks
  app.service('system/time').hooks(hooks)
}
