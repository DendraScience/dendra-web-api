'use strict';

const hooks = require('./hooks');
const { asyncHashDigest } = require('../../lib/utils');

const HASH_SPLIT_REGEX = /(.{1,4})/g;

class Service {
  setup(app) {
    this.app = app;
    this.connections = app.get('connections');
    this.aggregateApp = this.connections.aggregate.app;
    this.aggregateStoreApp = this.connections.aggregateStore.app;
  }

  async _create(data, params) {
    const hash = await asyncHashDigest(JSON.stringify(data.spec), 'sha256');
    const id = `${data.method}-${hash.match(HASH_SPLIT_REGEX).join('-')}`;

    data = Object.assign({}, data, {
      _id: id,
      build_at: new Date()
    });

    let aggDoc;
    let storeDoc;

    /*
      Attempt to create the aggregate.
       NOTE: PK violations are normal, and stop clients from building the same agg simultaneously.
     */

    try {
      aggDoc = await this.aggregateApp.service('/aggregates').create(data);
    } catch (err) {
      this.app.logger.error(`Create aggregates error: ${err.message}`);
    }

    /*
      Attempt to fetch the result from the store.
     */

    try {
      storeDoc = await this.aggregateStoreApp.service('/documents').get(id);
    } catch (err) {
      if (err.code !== 404) throw err;
    }

    /*
      Now return an (aggregrate) request and result based on what happened.
     */

    if (aggDoc) {
      /*
        An aggregate request was created.
       */

      if (storeDoc && storeDoc.content && storeDoc.content.result) {
        // A previously built result doc was found in the store
        return {
          request: aggDoc,
          result: storeDoc.content.result,
          status: 'created'
        };
      }

      // A previously built result doc was NOT found in the store
      return {
        request: aggDoc,
        status: 'created'
      };
    }

    /*
      Otherwise, an aggregate request was NOT created (likely since it already exists).
     */

    // A result doc was found in the store
    if (storeDoc && storeDoc.content) {
      return storeDoc.content;
    }

    // A result doc was NOT found in the store
    return {
      request: {
        _id: id
      },
      status: 'pending'
    };
  }

  create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this._create(current)));
    }

    return this._create(data, params);
  }
}

module.exports = function () {
  return function () {
    const app = this;

    app.use('/aggregates/request', new Service());

    // Get the wrapped service object, bind hooks
    const requestService = app.service('/aggregates/request');

    requestService.before(hooks.before);
    requestService.after(hooks.after);
  };
}();