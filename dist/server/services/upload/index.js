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
    Model: db.collection('uploads'),
    paginate: metadata.paginate,
    whitelist: metadata.whitelist
  });
  app.use('/uploads', mongoService);

  // Get the wrapped service object, bind hooks
  app.service('uploads').hooks(hooks);
};