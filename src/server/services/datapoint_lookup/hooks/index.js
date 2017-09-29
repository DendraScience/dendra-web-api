// const apiHooks = require('@dendra-science/api-hooks-common')
// const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const {errors} = require('feathers-errors')

// TODO: Allow POST request for longer query params?

exports.before = {
  // all: [],

  find: [
    (hook) => {
      const datastreams = hook.params.datastreams
      if (!Array.isArray(datastreams)) {
        const query = hook.params.query
        return hook.app.service('/datastreams/lookup').find({query: query}).then(datastreams => {
          hook.params.datastreams = datastreams
          return hook
        })
      }
    },

    (hook) => {
      const datastreams = hook.params.datastreams
      if (!Array.isArray(datastreams)) throw new errors.BadRequest('Expected datastreams')
    }
  ],

  get: hooks.disallow(),
  create: hooks.disallow(),
  update: hooks.disallow(),
  patch: hooks.disallow(),
  remove: hooks.disallow()
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
