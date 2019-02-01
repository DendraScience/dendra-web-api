const service = require('feathers-mongodb')
const hooks = require('./hooks')

module.exports = function (app) {
  const databases = app.get('databases')

  if (!(databases.mongodb && databases.mongodb.metadata)) return

  const {metadata} = databases.mongodb
  const {db} = metadata

  app.use('/places', service({
    Model: db.collection('places'),
    paginate: metadata.paginate
  }))

  // Get the wrapped service object, bind hooks
  const placeService = app.service('/places')

  placeService.hooks(hooks)
}
