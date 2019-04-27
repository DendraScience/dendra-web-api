"use strict";

const auth = require('@feathersjs/authentication');

const {
  disallow,
  iff
} = require('feathers-hooks-common');

module.exports = function (app) {
  app.service('authentication').hooks({
    before: {
      create: auth.hooks.authenticate(['jwt', 'local']),
      remove: auth.hooks.authenticate('jwt')
    },
    after: {
      // TODO: Move to an ability?
      create: iff(context => !context.params.user.is_enabled, disallow())
    }
  });
};