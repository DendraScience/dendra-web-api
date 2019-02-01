const service = require('feathers-mongodb')
const hooks = require('./hooks')

module.exports = function (app) {
  const databases = app.get('databases')

  if (!(databases.mongodb && databases.mongodb.metadata)) return

  const {metadata} = databases.mongodb
  const {db} = metadata

  app.use('/things', service({
    Model: db.collection('things'),
    paginate: metadata.paginate
  }))

  // Get the wrapped service object, bind hooks
  const thingService = app.service('/things')

  thingService.hooks(hooks)
}
