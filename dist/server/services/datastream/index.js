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
  const mongoService = service({
    Model: db.collection('datastreams'),
    paginate: metadata.paginate,
    whitelist: metadata.whitelist
  });
  app.use('/datastreams', mongoService);

  // Get the wrapped service object, bind hooks
  app.service('datastreams').hooks(hooks);
};