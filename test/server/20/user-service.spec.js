/**
 * Tests for user service
 */

const dataFile = 'demo-user.user'
const servicePath = 'users'

describe(`Service ${servicePath}`, function() {
  const id = {}

  let demoClient
  let demoUser

  const cleanup = async () => {
    await coll.users.remove({ email: demoUser.email })
  }

  before(async function() {
    demoUser = await helper.loadData(dataFile)

    await cleanup()
  })

  after(async function() {
    return cleanup()
  })

  describe('#create()', function() {
    it('guest should create with error', function() {
      return helper.shouldCreateWithError(
        clients.guest,
        servicePath,
        dataFile,
        'NotAuthenticated'
      )
    })

    it('user should create with error', function() {
      return helper.shouldCreateWithError(
        clients.user,
        servicePath,
        dataFile,
        'Forbidden'
      )
    })

    it('sys admin should create multiple with error', function() {
      return helper.shouldCreateWithError(
        clients.sysAdmin,
        servicePath,
        [dataFile, dataFile],
        'MethodNotAllowed'
      )
    })

    it('sys admin should create without error', function() {
      return helper
        .shouldCreateWithoutError(clients.sysAdmin, servicePath, dataFile)
        .then(({ retDoc }) => {
          id.doc = retDoc._id
        })
    })
  })

  describe('auth', function() {
    it('demo user (disabled) should authenticate with error', async function() {
      let retApp
      let retErr

      await coll.users.updateOne(
        { email: demoUser.email },
        { $set: { is_enabled: false } }
      )

      try {
        retApp = await helper.authenticate({
          email: demoUser.email,
          password: demoUser.password
        })
      } catch (err) {
        retErr = err
      }

      /* eslint-disable-next-line no-unused-expressions */
      expect(retApp).to.be.undefined
      expect(retErr).to.have.property(
        'code',
        helper.getCode('MethodNotAllowed')
      )
    })

    it('demo user (enabled) should authenticate without error', async function() {
      let retApp
      let retErr

      await coll.users.updateOne(
        { email: demoUser.email },
        { $set: { is_enabled: true } }
      )

      try {
        retApp = await helper.authenticate({
          email: demoUser.email,
          password: demoUser.password
        })
      } catch (err) {
        retErr = err
      }

      /* eslint-disable-next-line no-unused-expressions */
      expect(retErr).to.be.undefined
      expect(retApp).to.have.property('service')

      demoClient = retApp
    })
  })

  describe('#get()', function() {
    it('guest should get with error', function() {
      return helper.shouldGetWithError(
        clients.guest,
        servicePath,
        id.doc,
        'NotFound'
      )
    })

    it('user should get with error', function() {
      return helper.shouldGetWithoutError(clients.user, servicePath, id.doc)
    })

    it('demo user should get without error', function() {
      return helper.shouldGetWithoutError(demoClient, servicePath, id.doc)
    })

    it('sys admin should get without error', function() {
      return helper.shouldGetWithoutError(clients.sysAdmin, servicePath, id.doc)
    })
  })

  describe('#find()', function() {
    it('guest should find without error', function() {
      return helper.shouldFindWithoutError(clients.guest, servicePath, {}, 0)
    })

    it('user should find without error', function() {
      return helper.shouldFindWithoutError(clients.user, servicePath, {}, 3)
    })

    it('demo user should find without error', function() {
      return helper.shouldFindWithoutError(demoClient, servicePath, {}, 3)
    })

    it('sys admin should find without error', function() {
      return helper.shouldFindWithoutError(clients.sysAdmin, servicePath, {}, 3)
    })
  })

  describe('#patch()', function() {
    it('guest should patch with error', function() {
      return helper.shouldPatchWithError(
        clients.guest,
        servicePath,
        id.doc,
        `${dataFile}.patch`,
        'NotAuthenticated'
      )
    })

    it('user should patch with error', function() {
      return helper.shouldPatchWithError(
        clients.user,
        servicePath,
        id.doc,
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('demo user should patch without error', function() {
      return helper
        .shouldPatchWithoutError(
          demoClient,
          servicePath,
          id.doc,
          `${dataFile}.patch.demo-user`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property(
            'full_name',
            'Demo User - Patched - Demo User'
          )
        })
    })

    it('sys admin should patch multiple with error', function() {
      return helper.shouldPatchMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.doc },
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('sys admin should patch bad data with error', function() {
      return helper.shouldPatchWithError(
        clients.sysAdmin,
        servicePath,
        id.doc,
        'bad.patch',
        'BadRequest'
      )
    })

    it('sys admin should patch without error', function() {
      return helper
        .shouldPatchWithoutError(
          clients.sysAdmin,
          servicePath,
          id.doc,
          `${dataFile}.patch`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('full_name', 'Demo User - Patched')
        })
    })
  })

  describe('#update()', function() {
    it('guest should update with error', function() {
      return helper.shouldUpdateWithError(
        clients.guest,
        servicePath,
        id.doc,
        `${dataFile}.update`,
        'NotAuthenticated'
      )
    })

    it('user should update with error', function() {
      return helper.shouldUpdateWithError(
        clients.user,
        servicePath,
        id.doc,
        `${dataFile}.update`,
        'Forbidden'
      )
    })

    it('demo user should update with error', function() {
      return helper.shouldUpdateWithError(
        demoClient,
        servicePath,
        id.doc,
        `${dataFile}.update`,
        'Forbidden'
      )
    })

    it('sys admin should update multiple with error', function() {
      return helper.shouldUpdateMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.doc },
        `${dataFile}.update`,
        'BadRequest'
      )
    })

    it('sys admin should update without error', function() {
      return helper
        .shouldUpdateWithoutError(
          clients.sysAdmin,
          servicePath,
          id.doc,
          `${dataFile}.update`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('full_name', 'Demo User - Updated')
        })
    })
  })

  describe('#remove()', function() {
    it('guest should remove with error', function() {
      return helper.shouldRemoveWithError(
        clients.guest,
        servicePath,
        id.doc,
        'NotAuthenticated'
      )
    })

    it('user should remove with error', function() {
      return helper.shouldRemoveWithError(
        clients.user,
        servicePath,
        id.doc,
        'Forbidden'
      )
    })

    it('demo user should remove with error', function() {
      return helper.shouldRemoveWithError(
        demoClient,
        servicePath,
        id.doc,
        'Forbidden'
      )
    })

    it('sys admin should remove multiple with error', function() {
      return helper.shouldRemoveMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.doc },
        'MethodNotAllowed'
      )
    })

    it('sys admin should remove without error', function() {
      return helper.shouldRemoveWithoutError(
        clients.sysAdmin,
        servicePath,
        id.doc
      )
    })
  })
})
