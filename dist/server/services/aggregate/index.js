'use strict';

const hooks = require('./hooks');

class Service {
  constructor() {
    // HACK: Syntax highlighting breaks on class methods named 'get'
    this.get = this._get;
  }

  setup(app) {
    this.app = app;
    this.connections = app.get('connections');
    this.aggregateApp = this.connections.aggregate.app;
  }

  find(...args) {
    // Proxy to aggregate API
    return this.aggregateApp.service('/aggregates').find(...args);
  }

  _get(...args) {
    // Proxy to aggregate API
    return this.aggregateApp.service('/aggregates').get(...args);
  }

  create(...args) {
    // Proxy to aggregate API
    return this.aggregateApp.service('/aggregates').create(...args);
  }

  remove(...args) {
    // Proxy to aggregate API
    return this.aggregateApp.service('/aggregates').remove(...args);
  }
}

module.exports = function () {
  return function () {
    const app = this;

    app.use('/aggregates', new Service());

    // Get the wrapped service object, bind hooks
    const aggregateService = app.service('/aggregates');

    aggregateService.before(hooks.before);
    aggregateService.after(hooks.after);
  };
}();