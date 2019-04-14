/**
 * Tests for user service
 */

const dataFile = 'sample-user.user'
const servicePath = 'users'

describe(`Service ${servicePath}`, function() {
  const id = {}

  let sampleConn
  let sampleUser

  const cleanup = async () => {
    await coll.schemes.remove({ email: sampleUser.email })
  }

  before(async function() {
    sampleUser = await helper.loadData(dataFile)

    await cleanup()
  })

  after(async function() {
    return cleanup()
  })

  describe('#create()', function() {
    it('guest should create with error', function() {
      return helper.shouldCreateWithError(
        conn.guest,
        servicePath,
        dataFile,
        'NotAuthenticated'
      )
    })

    it('user should create with error', function() {
      return helper.shouldCreateWithError(
        conn.user,
        servicePath,
        dataFile,
        'Forbidden'
      )
    })

    it('sys admin should create multiple with error', function() {
      return helper.shouldCreateWithError(
        conn.sysAdmin,
        servicePath,
        [dataFile, dataFile],
        'MethodNotAllowed'
      )
    })

    it('sys admin should create without error', function() {
      return helper
        .shouldCreateWithoutError(conn.sysAdmin, servicePath, dataFile)
        .then(({ retDoc }) => {
          id.doc = retDoc._id
        })
    })
  })

  describe('auth', function() {
    it('sample user (disabled) should authenticate with error', async function() {
      let retApp
      let retErr

      await coll.users.updateOne(
        { email: sampleUser.email },
        { $set: { is_enabled: false } }
      )

      try {
        retApp = await helper.authenticate({
          email: sampleUser.email,
          password: sampleUser.password
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

    it('sample user (enabled) should authenticate without error', async function() {
      let retApp
      let retErr

      await coll.users.updateOne(
        { email: sampleUser.email },
        { $set: { is_enabled: true } }
      )

      try {
        retApp = await helper.authenticate({
          email: sampleUser.email,
          password: sampleUser.password
        })
      } catch (err) {
        retErr = err
      }

      /* eslint-disable-next-line no-unused-expressions */
      expect(retErr).to.be.undefined
      expect(retApp).to.have.property('service')

      sampleConn = retApp
    })
  })

  describe('#get()', function() {
    it('guest should get with error', function() {
      return helper.shouldGetWithError(
        conn.guest,
        servicePath,
        id.doc,
        'NotFound'
      )
    })

    it('user should get with error', function() {
      return helper.shouldGetWithError(
        conn.user,
        servicePath,
        id.doc,
        'NotFound'
      )
    })

    it('sample user should get without error', function() {
      return helper.shouldGetWithoutError(sampleConn, servicePath, id.doc)
    })

    it('sys admin should get without error', function() {
      return helper.shouldGetWithoutError(conn.sysAdmin, servicePath, id.doc)
    })
  })

  describe.skip('#find()', function() {
    it('guest should find without error', function() {
      return helper.shouldFindWithoutError(conn.guest, servicePath)
    })

    it('user should find without error', function() {
      return helper.shouldFindWithoutError(conn.user, servicePath)
    })

    it('sys admin should find without error', function() {
      return helper.shouldFindWithoutError(conn.sysAdmin, servicePath)
    })
  })

  describe('#patch()', function() {
    it('guest should patch with error', function() {
      return helper.shouldPatchWithError(
        conn.guest,
        servicePath,
        id.doc,
        `${dataFile}.patch`,
        'NotAuthenticated'
      )
    })

    it('user should patch with error', function() {
      return helper.shouldPatchWithError(
        conn.user,
        servicePath,
        id.doc,
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('sample user should patch without error', function() {
      return helper
        .shouldPatchWithoutError(
          sampleConn,
          servicePath,
          id.doc,
          `${dataFile}.patch.sample-user`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property(
            'full_name',
            'Test User - Patched - Sample User'
          )
        })
    })

    it('sys admin should patch multiple with error', function() {
      return helper.shouldPatchMultipleWithError(
        conn.sysAdmin,
        servicePath,
        { _id: id.doc },
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('sys admin should patch without error', function() {
      return helper
        .shouldPatchWithoutError(
          conn.sysAdmin,
          servicePath,
          id.doc,
          `${dataFile}.patch`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('full_name', 'Test User - Patched')
        })
    })
  })

  describe('#update()', function() {
    it('guest should update with error', function() {
      return helper.shouldUpdateWithError(
        conn.guest,
        servicePath,
        id.doc,
        `${dataFile}.update`,
        'NotAuthenticated'
      )
    })

    it('user should update with error', function() {
      return helper.shouldUpdateWithError(
        conn.user,
        servicePath,
        id.doc,
        `${dataFile}.update`,
        'Forbidden'
      )
    })

    it('sample user should update with error', function() {
      return helper.shouldUpdateWithError(
        sampleConn,
        servicePath,
        id.doc,
        `${dataFile}.update`,
        'Forbidden'
      )
    })

    it('sys admin should update multiple with error', function() {
      return helper.shouldUpdateMultipleWithError(
        conn.sysAdmin,
        servicePath,
        { _id: id.doc },
        `${dataFile}.update`,
        'BadRequest'
      )
    })

    it('sys admin should update without error', function() {
      return helper
        .shouldUpdateWithoutError(
          conn.sysAdmin,
          servicePath,
          id.doc,
          `${dataFile}.update`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('full_name', 'Test User - Updated')
        })
    })
  })

  describe('#remove()', function() {
    it('guest should remove with error', function() {
      return helper.shouldRemoveWithError(
        conn.guest,
        servicePath,
        id.doc,
        'NotAuthenticated'
      )
    })

    it('user should remove with error', function() {
      return helper.shouldRemoveWithError(
        conn.user,
        servicePath,
        id.doc,
        'Forbidden'
      )
    })

    // it('sample user should remove with error', function() {
    // })

    it('sys admin should remove multiple with error', function() {
      return helper.shouldRemoveMultipleWithError(
        conn.sysAdmin,
        servicePath,
        { _id: id.doc },
        'MethodNotAllowed'
      )
    })

    it('sys admin should remove without error', function() {
      return helper.shouldRemoveWithoutError(conn.sysAdmin, servicePath, id.doc)
    })
  })
})
