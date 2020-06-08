const hooks = require('./hooks')

class Service {
  async get() {}
}

module.exports = function (app) {
  app.use('/ability', new Service())

  // Get the wrapped service object, bind hooks
  app.service('ability').hooks(hooks)
}
