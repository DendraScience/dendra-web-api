const service = require('feathers-mongodb')
const hooks = require('./hooks')

module.exports = function (app) {
  const databases = app.get('databases')

  if (!(databases.mongodb && databases.mongodb.metadata)) return

  const {metadata} = databases.mongodb
  const {db} = metadata

  app.use('/users', service({
    Model: db.collection('users'),
    paginate: metadata.paginate
  }))

  // Get the wrapped service object, bind hooks
  const userService = app.service('/users')

  userService.hooks(hooks)
}
