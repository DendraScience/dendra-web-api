'use strict';

const auth = require('feathers-authentication');
const jwt = require('feathers-authentication-jwt');
const local = require('feathers-authentication-local');

module.exports = function () {
  return function () {
    const app = this;

    app.configure(auth(app.get('authentication'))).configure(jwt()).configure(local());

    app.service('/authentication').hooks({
      before: {
        create: [auth.hooks.authenticate(['jwt', 'local'])],
        remove: [auth.hooks.authenticate('jwt')]
      }
    });
  };
}();