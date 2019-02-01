const errors = require('@feathersjs/errors')
const moment = require('moment-timezone')
const hooks = require('./hooks')

class Service {
  constructor (options = {}) {
    this.id = options.id || '_id'
  }

  get (id) {
    const now = moment().tz(id)

    if (now.tz()) {
      return Promise.resolve({
        [this.id]: id,
        now: now.format()
      })
    }

    return Promise.reject(
      new errors.NotFound(`No record found for id '${id}'`)
    )
  }
}

module.exports = function (app) {
  app.use('/system/time', new Service())

  // Get the wrapped service object, bind hooks
  const timeService = app.service('/system/time')

  timeService.hooks(hooks)
}
