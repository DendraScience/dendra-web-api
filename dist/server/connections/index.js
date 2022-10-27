"use strict";

const feathers = require('@feathersjs/feathers');
const rest = require('@feathersjs/rest-client');
const axios = require('axios');
module.exports = function (app) {
  const connections = app.get('connections') || {};
  Object.values(connections).forEach(connection => {
    connection.app = feathers().configure(rest(connection.url).axios(axios));
  });
};