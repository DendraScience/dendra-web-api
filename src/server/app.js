/**
 * Web API app.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module server/app
 */

const compress = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const qs = require('qs')

const feathers = require('@feathersjs/feathers')
const configuration = require('@feathersjs/configuration')
const express = require('@feathersjs/express')
const auth = require('@feathersjs/authentication')
const jwt = require('@feathersjs/authentication-jwt')
const local = require('@feathersjs/authentication-local')
const socketio = require('@feathersjs/socketio')

const connections = require('./connections')
const databases = require('./databases')
const middleware = require('./middleware')
const schemas = require('./schemas')
const services = require('./services')
const channels = require('./channels')
const pools = require('./pools')

module.exports = async logger => {
  const app = express(feathers())

  app.logger = logger

  // Configure
  app.configure(configuration())

  await databases(app)

  // Fix for big anotation worker queries
  // SEE: https://github.com/expressjs/body-parser/issues/289
  app.set('query parser', function (str) {
    return qs.parse(str, { arrayLimit: 2000 })
  })

  // Feathers setup
  app.use(cors())
  app.use(helmet())
  app.use(compress())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.configure(express.rest())
  app.configure(auth(app.get('authentication')))
  app.configure(jwt())
  app.configure(local())
  app.configure(socketio())
  app.configure(connections)
  app.configure(middleware)
  app.configure(schemas)
  app.configure(services)
  app.configure(channels)
  app.configure(pools)

  app.use(express.notFound())
  app.use(express.errorHandler({ logger }))

  return app
}
