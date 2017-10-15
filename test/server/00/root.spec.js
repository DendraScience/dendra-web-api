/**
 * Root level hooks
 */

const feathers = require('feathers')
const restClient = require('feathers-rest/client')
const request = require('request')

before(function () {
  return Promise.resolve(main.app.get('serverReady')).then(() => {
    const databases = main.app.get('databases')

    global.guest = feathers()
      .configure(restClient('http://localhost:3030').request(request))

    if (databases.mongodb && databases.mongodb.metadata) {
      return Promise.resolve(databases.mongodb.metadata.db).then(db => {
        return Promise.all([
          db.collection('users').remove({email: 'user_test_nonadmin@test.dendra.science'}),
          db.collection('users').remove({email: 'user_test_sysadmin@test.dendra.science'})
        ]).then(() => {
          return Promise.all([
            db.collection('users').insert({
              email: 'user_test_nonadmin@test.dendra.science',
              full_name: 'Test Non Admin User',
              name: 'Test Non Admin',
              password: '$2a$12$99EVJdX6ZWfNvYVZlL2Guew4yNpGuNWrKM1gZeLOQamJhK7A2kL9i'
            }),
            db.collection('users').insert({
              email: 'user_test_sysadmin@test.dendra.science',
              full_name: 'Test Sys Admin User',
              name: 'Test Sys Admin',
              password: '$2a$12$99EVJdX6ZWfNvYVZlL2Guew4yNpGuNWrKM1gZeLOQamJhK7A2kL9i',
              roles: ['sys-admin']
            })
          ])
        })
      }).then(() => {
        return guest.service('/authentication').create({
          email: 'user_test_nonadmin@test.dendra.science',
          password: 'def456',
          strategy: 'local'
        })
      }).then(doc => {
        global.nonAdmin = feathers()
          .configure(restClient('http://localhost:3030').request(request.defaults({
            headers: {
              'Authorization': doc.accessToken
            }
          })))
      }).then(() => {
        return guest.service('/authentication').create({
          email: 'user_test_sysadmin@test.dendra.science',
          password: 'def456',
          strategy: 'local'
        })
      }).then(doc => {
        global.sysAdmin = feathers()
          .configure(restClient('http://localhost:3030').request(request.defaults({
            headers: {
              'Authorization': doc.accessToken
            }
          })))
      })
    }
  })
})

after(function () {
  const databases = main.app.get('databases')

  if (databases.mongodb && databases.mongodb.metadata) {
    return Promise.resolve(databases.mongodb.metadata.db).then(db => {
      return Promise.all([
        db.collection('users').remove({email: 'user_test_nonadmin@test.dendra.science'}),
        db.collection('users').remove({email: 'user_test_sysadmin@test.dendra.science'})
      ])
    })
  }
})
