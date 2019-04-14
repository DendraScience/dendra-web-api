"use strict";

const service = require('feathers-mongodb');

const hooks = require('./hooks');

module.exports = function (app) {
  const databases = app.get('databases');
  if (!(databases.mongodb && databases.mongodb.metadata)) return;
  const {
    metadata
  } = databases.mongodb;
  const {
    db
  } = metadata;
  app.use('/users', service({
    Model: db.collection('users'),
    paginate: metadata.paginate,
    whitelist: metadata.whitelist
  })); // Get the wrapped service object, bind hooks

  app.service('users').hooks(hooks);
};