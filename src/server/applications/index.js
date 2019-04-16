const feathers = require('@feathersjs/feathers')
const restClient = require('@feathersjs/rest-client')
const request = require('request')

module.exports = function(app) {
  const applications = app.get('applications') || {}

  Object.values(applications).forEach(application => {
    application.app = feathers().configure(
      restClient(application.url).request(request)
    )
  })
}
