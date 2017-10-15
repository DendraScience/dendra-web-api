const service = require('feathers-mongodb')
const hooks = require('./hooks')

module.exports = (function () {
  return function () {
    const app = this
    const databases = app.get('databases')

    if (databases.mongodb && databases.mongodb.metadata) {
      app.set('serviceReady',
        Promise.resolve(databases.mongodb.metadata.db).then(db => {
          app.use('/users', service({
            Model: db.collection('users'),
            paginate: databases.mongodb.metadata.paginate
          }))

          // Get the wrapped service object, bind hooks
          const userService = app.service('/users')

          userService.before(hooks.before)
          userService.after(hooks.after)
        }))
    }
  }
})()
