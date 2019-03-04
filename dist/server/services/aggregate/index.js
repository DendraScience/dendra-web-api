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
    this.aggregateBuildApp = this.connections.aggregateBuild.app;
  }

  find(params) {
    // Proxy to aggregate build API
    return this.aggregateBuildApp.service('/builds').find(params);
  }

  _get(id, params) {
    // Proxy to aggregate build API
    return this.aggregateBuildApp.service('/builds').get(id, params);
  }

  create(data, params) {
    // Proxy to aggregate build API
    return this.aggregateBuildApp.service('/builds').create(data, params);
  }

  remove(id, params) {
    // Proxy to aggregate build API
    return this.aggregateBuildApp.service('/builds').remove(id, params);
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