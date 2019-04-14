/**
 * Tests for scheme service
 */

const dataFile = 'ds.scheme'
const servicePath = 'schemes'

describe(`Service ${servicePath}`, function() {
  const id = {}

  const cleanup = async () => {
    await coll.schemes.remove()
  }

  before(async function() {
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

  describe('#get()', function() {
    it('guest should get without error', function() {
      return helper.shouldGetWithoutError(conn.guest, servicePath, id.doc)
    })

    it('user should get without error', function() {
      return helper.shouldGetWithoutError(conn.user, servicePath, id.doc)
    })

    it('sys admin should get without error', function() {
      return helper.shouldGetWithoutError(conn.sysAdmin, servicePath, id.doc)
    })
  })

  describe('#find()', function() {
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
          expect(retDoc).to.have.property(
            'name',
            'Dendra System Controlled Vocabularies - Patched'
          )
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
          expect(retDoc).to.have.property(
            'name',
            'Dendra System Controlled Vocabularies - Updated'
          )
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
