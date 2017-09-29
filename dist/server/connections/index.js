'use strict';

const feathers = require('feathers');
const restClient = require('feathers-rest/client');
const request = require('request');

module.exports = function () {
  return function () {
    const app = this;
    const connections = app.get('connections') || {};

    Object.keys(connections).forEach(key => {
      const connection = connections[key];

      connection.app = feathers().configure(restClient(connection.url).request(request));
    });
  };
}();