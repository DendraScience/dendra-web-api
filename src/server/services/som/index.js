const service = require('feathers-mongodb')
const hooks = require('./hooks')

module.exports = function (app) {
  const databases = app.get('databases')

  if (!(databases.mongodb && databases.mongodb.metadata)) return

  const {metadata} = databases.mongodb
  const {db} = metadata

  const mongoService = service({
    Model: db.collection('soms'),
    paginate: metadata.paginate
  })

  // HACK: Monkey-patch the service to allow for string IDs
  mongoService._objectifyId = id => id

  app.use('/soms', mongoService)

  // Get the wrapped service object, bind hooks
  const somService = app.service('/soms')

  somService.hooks(hooks)
}
