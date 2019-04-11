"use strict";

const ajv = require('../lib/ajv');

const fs = require('fs');

const path = require('path');

module.exports = function (app) {
  const schemaPath = path.resolve(__dirname, '../../../schema');
  const names = fs.readdirSync(schemaPath).filter(name => {
    return name.endsWith('.json');
  });
  ajv({
    schemas: names.map(name => JSON.parse(fs.readFileSync(path.join(schemaPath, name), 'utf8')))
  });
  app.set('schemaPath', schemaPath);
  app.set('schemaNames', names);
};