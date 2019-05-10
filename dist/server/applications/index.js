"use strict";

const feathers = require('@feathersjs/feathers');

const rest = require('@feathersjs/rest-client');

const axios = require('axios');

module.exports = function (app) {
  const applications = app.get('applications') || {};
  Object.values(applications).forEach(application => {
    application.app = feathers().configure(rest(application.url).axios(axios));
  });
};