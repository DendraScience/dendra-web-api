const feathers = require('@feathersjs/feathers')
const restClient = require('@feathersjs/rest-client')
const request = require('request')

module.exports = function(app) {
  const connections = app.get('connections') || {}

  Object.values(connections).forEach(connection => {
    connection.app = feathers().configure(
      restClient(connection.url).request(request)
    )
  })
}
