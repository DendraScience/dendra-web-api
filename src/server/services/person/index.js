const service = require('feathers-mongodb')
const hooks = require('./hooks')

module.exports = function (app) {
  const databases = app.get('databases')

  if (!(databases.mongodb && databases.mongodb.metadata)) return

  const {metadata} = databases.mongodb
  const {db} = metadata

  app.use('/persons', service({
    Model: db.collection('persons'),
    paginate: metadata.paginate
  }))

  // Get the wrapped service object, bind hooks
  const personService = app.service('/persons')

  personService.hooks(hooks)
}
