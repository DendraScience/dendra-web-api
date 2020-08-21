"use strict";

// const errors = require('@feathersjs/errors')
// const merge = require('lodash.merge')
module.exports = event => {
  return async context => {
    if (context.type !== 'after') {
      throw new Error("The 'signalBackend' hook should only be used as an 'after' hook.");
    }

    const backend = context.app.get('backend');
    if (!(backend && backend.url && context.params.provider)) return context;
    const {
      app,
      method,
      params
    } = context;
    if (method === 'find' || method === 'get') return context;

    if (params.headers && params.headers.authorization) {
      /*
        Exchange authorization for a short-lived auth token.
       */
      const result = await app.service('authentication').create({
        accessToken: params.headers.authorization
      }, {
        authenticated: false,
        jwt: backend.jwt,
        provider: params.provider
      });
      /* eslint-disable-next-line no-console */

      console.log('result', result); // const methodMap = {
      //   find: 'GET',
      //   get: 'GET',
      //   create: 'POST',
      //   update: 'PUT',
      //   patch: 'PATCH',
      //   remove: 'DELETE'
      // }
      // const request = {
      //   query: {}, // context.data,
      //   body: {}, // context.data,
      //   params: {}, // context.params,
      //   path: '', // context.path,
      //   method: methodMap[context.method] || context.method,
      //   headers: params.headers || {},
      //   cookies: params.cookies || {},
      //   session: {}
      // }
      // const strategy = 'jwt'
      // const strategyOptions = merge({}, app.passport.options(strategy))
      // /* eslint-disable-next-line no-console */
      // console.log('strategyOptions', strategyOptions)
      // return app
      //   .authenticate(
      //     strategy,
      //     strategyOptions
      //   )(request)
      //   .then((result = {}) => {
      //     /* eslint-disable-next-line no-console */
      //     console.log('request', request)
      //     /* eslint-disable-next-line no-console */
      //     console.log('result', result)
      //     return context
      //   })
    } // const { method: action, params, path: serviceName } = context
    // const { ability } = params
    // if (!ability) {
    //   throw new Error(
    //     "The 'restrictQueryToAbility' hook requires params.ability."
    //   )
    // }
    // const query = toMongoQuery(ability, serviceName, action)
    // if (!params.query) params.query = {}
    // if (query !== null) {
    //   params.query.$and = (params.query.$and || []).concat(query)
    // } else if (action === 'find') {
    //   params.query.$limit = 0
    // } else {
    //   throw new errors.NotFound(`No record found for id '${context.id}'.`)
    // }


    return context;
  };
};