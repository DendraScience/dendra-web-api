"use strict";

const Sequelize = require('sequelize');
const models = require('./models');
const _ = require('lodash');
module.exports = async app => {
  const {
    legacy
  } = app.get('databases').mysql;

  // Configure a new instance
  const opts = _.merge({}, legacy.options, {
    define: {
      timestamps: false,
      underscored: true
    },
    dialect: 'mysql',
    logging(message) {
      app.logger.log({
        level: 'info',
        message
      });
    }
  });
  const sequelize = new Sequelize(legacy.url, opts);
  legacy.Sequelize = Sequelize;
  legacy.sequelize = sequelize;
  legacy.models = models(sequelize);
};