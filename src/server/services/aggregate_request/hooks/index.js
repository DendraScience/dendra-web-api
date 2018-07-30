const commonHooks = require('feathers-hooks-common')
const globalHooks = require('../../../hooks')

const SCHEMA_NAME = 'aggregate.json'

exports.before = {
  // all: [],
  find: commonHooks.disallow(),
  get: commonHooks.disallow(),

  create: [
    globalHooks.validate(SCHEMA_NAME)
  ],

  update: commonHooks.disallow(),
  patch: commonHooks.disallow(),
  remove: commonHooks.disallow()
}

exports.after = {
  // all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
