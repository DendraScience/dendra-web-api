/**
 * Root level hooks
 */

const feathers = require('@feathersjs/feathers')
const restClient = require('@feathersjs/rest-client')
const request = require('request')
const log = console

let server

before(async function () {
  this.timeout(20000)

  app = await app(log)

  const host = app.get('host')
  const port = app.get('port')

  server = app.listen(port)

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.once('listening', () => {
      log.info('Feathers application started on %s:%s', host, port)
      resolve()
    })
  })

  global.baseUrl = `http://${host}:${port}`
  global.metadata = app.get('databases').mongodb.metadata

  global.coll = [
    'annotations',
    'companies',
    'datastreams',
    'downloads',
    'memberships',
    'organizations',
    'persons',
    'places',
    'schemes',
    'soms',
    'stations',
    'thing_types',
    'uoms',
    'uploads',
    'users',
    'vocabularies'
  ].reduce((obj, name) => {
    obj[name] = metadata.db.collection(name)
    return obj
  }, {})

  /*
    Create root users
   */

  const rootSysAdmin = await helper.loadData('root-sysadmin.user')
  const rootUser = await helper.loadData('root-user.user')

  await coll.users.remove({ email: rootSysAdmin.email })
  await coll.users.remove({ email: rootUser.email })
  await coll.users.insert(rootSysAdmin)
  await coll.users.insert(rootUser)

  global.testData = {
    rootSysAdmin,
    rootUser
  }

  /*
    Configure clients
   */

  const guest = feathers().configure(restClient(baseUrl).request(request))

  helper.authenticate = async cred => {
    const auth = await guest.service('/authentication').create(
      Object.assign(
        {
          password: 'abc123',
          strategy: 'local'
        },
        cred
      )
    )

    return feathers().configure(
      restClient(baseUrl).request(
        request.defaults({
          headers: {
            Authorization: auth.accessToken
          }
        })
      )
    )
  }

  const sysAdmin = await helper.authenticate({
    email: rootSysAdmin.email,
    password: 'def456'
  })

  const user = await helper.authenticate({
    email: rootUser.email,
    password: 'def456'
  })

  global.clients = {
    guest,
    sysAdmin,
    user
  }
})

after(async function () {
  this.timeout(20000)

  await new Promise((resolve, reject) =>
    server.close(err => (err ? reject(err) : resolve()))
  )
  server.unref()

  const pools = app.get('pools')
  if (pools)
    await Promise.all(Object.keys(pools).map(key => pools[key].destroy()))

  await coll.users.remove({ email: testData.rootSysAdmin.email })
  await coll.users.remove({ email: testData.rootUser.email })

  await metadata.client.close()
})
