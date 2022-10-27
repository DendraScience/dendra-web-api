"use strict";

const errors = require('@feathersjs/errors');
const axios = require('axios');
const _ = require('lodash');

// TODO: Migrate to a Feathers event listener!
const EVENTS = {
  create: 'created',
  patch: 'patched',
  remove: 'removed',
  update: 'updated'
};
module.exports = event => {
  return async context => {
    if (context.type !== 'after') {
      throw new Error("The 'signalBackend' hook should only be used as an 'after' hook.");
    }
    const event = EVENTS[context.method];
    if (!event) return context;
    const {
      app,
      data,
      params
    } = context;
    const backend = app.get('backend');
    if (!(backend && backend.url)) return context;
    const headers = {
      'Dendra-Event': `${_.kebabCase(context.path)}.${event}`
    };
    if (params.provider) headers['Dendra-Provider'] = params.provider;
    if (params.user && params.user._id) headers['Dendra-User-Id'] = `${params.user._id}`;
    const message = {};
    if (params.before) message.before = params.before;
    if (context.result) message.result = context.result;
    if (context.method === 'patch') {
      message.patch = {};
      if (data && data.$set) message.patch.set_keys = Object.keys(data.$set);
      if (data && data.$unset) message.patch.unset_keys = Object.keys(data.$unset);
    }
    if (params.headers && params.headers.authorization) {
      /*
        Exchange authorization for a short-lived auth token.
       */
      try {
        const auth = await app.service('authentication').create({
          accessToken: params.headers.authorization
        }, {
          authenticated: false,
          jwt: backend.jwt,
          provider: params.provider
        });
        if (auth.accessToken) headers['Dendra-Access-Token'] = auth.accessToken;
      } catch (err) {
        app.logger.error(err);
      }
    }

    /*
      POST an event to the backend webhook.
     */
    try {
      const response = await axios.post(backend.url, message, _.merge({}, backend.config, {
        headers
      }));
      if (!(response.status === 200 || response.status === 201)) throw new errors.BadRequest(`The backend returned a non-success status code ${response.status}`);
    } catch (err) {
      app.logger.error(err);
    }
    return context;
  };
};