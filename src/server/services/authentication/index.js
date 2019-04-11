const auth = require('@feathersjs/authentication')

module.exports = function(app) {
  app.service('/authentication').hooks({
    before: {
      create: [auth.hooks.authenticate(['jwt', 'local'])],
      remove: [auth.hooks.authenticate('jwt')]
    }
  })
}
