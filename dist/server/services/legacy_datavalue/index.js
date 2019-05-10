"use strict";

const service = require('feathers-sequelize');

const hooks = require('./hooks');

module.exports = function (app) {
  const databases = app.get('databases');
  if (!(databases.mysql && databases.mysql.legacy)) return;
  const {
    legacy
  } = databases.mysql;
  const {
    models,
    paginate
  } = legacy;
  Object.keys(models).forEach(name => {
    app.use(`/legacy/${name}`, service({
      Model: models[name],
      paginate
    })); // Get the wrapped service object, bind hooks

    app.service(`legacy/${name}`).hooks(hooks);
  });
};