"use strict";

const Ajv = require('ajv');

let shared;

module.exports = options => {
  if (!shared) {
    shared = new Ajv(options);

    require('ajv-merge-patch')(shared);
  }

  return shared;
};