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
    Model: db.collection('soms'),
    paginate: metadata.paginate,
    whitelist: metadata.whitelist
  });

  // HACK: Monkey-patch the service to allow for string IDs
  mongoService._objectifyId = id => id;
  app.use('/soms', mongoService);

  // Get the wrapped service object, bind hooks
  app.service('soms').hooks(hooks);
};