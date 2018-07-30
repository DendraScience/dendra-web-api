const hooks = require('./hooks')

class Service {
  constructor () {
    // HACK: Syntax highlighting breaks on class methods named 'get'
    this.get = this._get
  }

  setup (app) {
    this.app = app
    this.connections = app.get('connections')
    this.aggregateStoreApp = this.connections.aggregateStore.app
  }

  _get (...args) {
    // Proxy to aggregate JSON API
    return this.aggregateStoreApp.service('/documents').get(...args).then(doc => doc.content)
  }
}

module.exports = (function () {
  return function () {
    const app = this

    app.use('/aggregates/result', new Service())

    // Get the wrapped service object, bind hooks
    const resultService = app.service('/aggregates/result')

    resultService.before(hooks.before)
    resultService.after(hooks.after)
  }
})()
