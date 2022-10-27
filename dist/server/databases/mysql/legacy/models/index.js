"use strict";

const path = require('path');
module.exports = sequelize => {
  const names = ['datavalues2', 'datavalues-borr', 'datavalues-day', 'datavalues-month', 'datavalues-motes', 'datavalues-sagehen', 'datavalues-seasonal', 'datavalues-ucnrs'];
  const models = {};
  names.forEach(name => {
    models[name] = sequelize.import(path.join(__dirname, name.toLowerCase()));
  });
  return models;
};