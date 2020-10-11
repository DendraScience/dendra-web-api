/**
 * Tests for download service
 */

const dataFile = 'demo.download'
const servicePath = 'downloads'

describe(`Service ${servicePath}`, function () {
  const id = {}

  const cleanup = async () => {
    await coll.downloads.remove()
  }

  before(async function () {
    await cleanup()
  })

  after(async function () {
    return cleanup()
  })

  describe('#create()', function () {
    it('guest should create with error', function () {
      return helper.shouldCreateWithError(
        clients.guest,
        servicePath,
        dataFile,
        'NotAuthenticated'
      )
    })

    it('user should create multiple with error', function () {
      return helper.shouldCreateWithError(
        clients.user,
        servicePath,
        [dataFile, dataFile],
        'MethodNotAllowed'
      )
    })

    it('user should create without error', function () {
      return helper
        .shouldCreateWithoutError(clients.user, servicePath, dataFile)
        .then(({ retDoc }) => {
          id.userDoc = retDoc._id
        })
    })

    it('sys admin should create multiple with error', function () {
      return helper.shouldCreateWithError(
        clients.sysAdmin,
        servicePath,
        [dataFile, dataFile],
        'MethodNotAllowed'
      )
    })

    it('sys admin should create without error', function () {
      return helper
        .shouldCreateWithoutError(clients.sysAdmin, servicePath, dataFile)
        .then(({ retDoc }) => {
          id.sysAdminDoc = retDoc._id
        })
    })
  })

  describe('#get()', function () {
    it('guest should get with error (user)', function () {
      return helper.shouldGetWithError(
        clients.guest,
        servicePath,
        id.userDoc,
        'NotFound'
      )
    })

    it('guest should get with error (sys admin)', function () {
      return helper.shouldGetWithError(
        clients.guest,
        servicePath,
        id.sysAdminDoc,
        'NotFound'
      )
    })

    it('user should get without error (user)', function () {
      return helper.shouldGetWithoutError(clients.user, servicePath, id.userDoc)
    })

    it('user should get with error (sys admin)', function () {
      return helper.shouldGetWithError(
        clients.user,
        servicePath,
        id.sysAdminDoc,
        'NotFound'
      )
    })

    it('sys admin should get without error (user)', function () {
      return helper.shouldGetWithoutError(
        clients.sysAdmin,
        servicePath,
        id.userDoc
      )
    })

    it('sys admin should get without error (sys admin)', function () {
      return helper.shouldGetWithoutError(
        clients.sysAdmin,
        servicePath,
        id.sysAdminDoc
      )
    })
  })

  describe('#find()', function () {
    it('guest should find without error', function () {
      return helper.shouldFindWithoutError(clients.guest, servicePath, {}, 0)
    })

    it('user should find without error', function () {
      return helper.shouldFindWithoutError(clients.user, servicePath, {}, 1)
    })

    it('sys admin should find without error', function () {
      return helper.shouldFindWithoutError(clients.sysAdmin, servicePath, {}, 2)
    })
  })

  describe('#patch()', function () {
    it('guest should patch with error (user)', function () {
      return helper.shouldPatchWithError(
        clients.guest,
        servicePath,
        id.userDoc,
        `${dataFile}.patch`,
        'NotAuthenticated'
      )
    })

    it('guest should patch with error (sys admin)', function () {
      return helper.shouldPatchWithError(
        clients.guest,
        servicePath,
        id.sysAdminDoc,
        `${dataFile}.patch`,
        'NotAuthenticated'
      )
    })

    it('user should patch with error (user)', function () {
      return helper.shouldPatchWithError(
        clients.user,
        servicePath,
        id.userDoc,
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('user should patch with error (sys admin)', function () {
      return helper.shouldPatchWithError(
        clients.user,
        servicePath,
        id.sysAdminDoc,
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('user should patch multiple with error (user)', function () {
      return helper.shouldPatchMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.userDoc },
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('sys admin should patch multiple with error (sys admin)', function () {
      return helper.shouldPatchMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.sysAdminDoc },
        `${dataFile}.patch`,
        'Forbidden'
      )
    })

    it('user should patch bad data with error (user)', function () {
      return helper.shouldPatchWithError(
        clients.sysAdmin,
        servicePath,
        id.userDoc,
        'bad.patch',
        'BadRequest'
      )
    })

    it('sys admin should patch bad data with error (sys admin)', function () {
      return helper.shouldPatchWithError(
        clients.sysAdmin,
        servicePath,
        id.sysAdminDoc,
        'bad.patch',
        'BadRequest'
      )
    })

    it('sys admin should patch without error (user)', function () {
      return helper
        .shouldPatchWithoutError(
          clients.sysAdmin,
          servicePath,
          id.userDoc,
          `${dataFile}.patch`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.nested.property(
            'result.comment',
            'Demo Download - Patched'
          )
        })
    })

    it('sys admin should patch without error (sys admin)', function () {
      return helper
        .shouldPatchWithoutError(
          clients.sysAdmin,
          servicePath,
          id.sysAdminDoc,
          `${dataFile}.patch`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.nested.property(
            'result.comment',
            'Demo Download - Patched'
          )
        })
    })
  })

  describe('#update()', function () {
    it('guest should update with error (user)', function () {
      return helper.shouldUpdateWithError(
        clients.guest,
        servicePath,
        id.userDoc,
        `${dataFile}.update`,
        'NotAuthenticated'
      )
    })

    it('guest should update with error (sys admin)', function () {
      return helper.shouldUpdateWithError(
        clients.guest,
        servicePath,
        id.sysAdminDoc,
        `${dataFile}.update`,
        'NotAuthenticated'
      )
    })

    it('user should update with error (user)', function () {
      return helper.shouldUpdateWithError(
        clients.user,
        servicePath,
        id.userDoc,
        `${dataFile}.update`,
        'Forbidden'
      )
    })

    it('user should update with error (sys admin)', function () {
      return helper.shouldUpdateWithError(
        clients.user,
        servicePath,
        id.sysAdminDoc,
        `${dataFile}.update`,
        'Forbidden'
      )
    })

    it('user should update multiple with error (user)', function () {
      return helper.shouldUpdateMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.userDoc },
        `${dataFile}.update`,
        'BadRequest'
      )
    })

    it('sys admin should update multiple with error (sys admin)', function () {
      return helper.shouldUpdateMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.sysAdminDoc },
        `${dataFile}.update`,
        'BadRequest'
      )
    })

    it('sys admin should update without error (user)', function () {
      return helper
        .shouldUpdateWithoutError(
          clients.sysAdmin,
          servicePath,
          id.userDoc,
          `${dataFile}.update`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.nested.property(
            'spec.comment',
            'Demo Download - Updated'
          )
        })
    })

    it('sys admin should update without error (sys admin)', function () {
      return helper
        .shouldUpdateWithoutError(
          clients.sysAdmin,
          servicePath,
          id.sysAdminDoc,
          `${dataFile}.update`
        )
        .then(({ retDoc }) => {
          expect(retDoc).to.have.nested.property(
            'spec.comment',
            'Demo Download - Updated'
          )
        })
    })
  })

  describe('#remove()', function () {
    it('guest should remove with error (user)', function () {
      return helper.shouldRemoveWithError(
        clients.guest,
        servicePath,
        id.userDoc,
        'NotAuthenticated'
      )
    })

    it('guest should remove with error (sys admin)', function () {
      return helper.shouldRemoveWithError(
        clients.guest,
        servicePath,
        id.sysAdminDoc,
        'NotAuthenticated'
      )
    })

    it('user should remove with error (user)', function () {
      return helper.shouldRemoveWithError(
        clients.user,
        servicePath,
        id.userDoc,
        'Forbidden'
      )
    })

    it('user should remove with error (sys admin)', function () {
      return helper.shouldRemoveWithError(
        clients.user,
        servicePath,
        id.sysAdminDoc,
        'Forbidden'
      )
    })

    it('user should remove multiple with error (user)', function () {
      return helper.shouldRemoveMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.userDoc },
        'MethodNotAllowed'
      )
    })

    it('sys admin should remove multiple with error (sys admin)', function () {
      return helper.shouldRemoveMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.sysAdminDoc },
        'MethodNotAllowed'
      )
    })

    it('sys admin should remove without error (user)', function () {
      return helper.shouldRemoveWithoutError(
        clients.sysAdmin,
        servicePath,
        id.userDoc
      )
    })

    it('sys admin should remove without error (sys admin)', function () {
      return helper.shouldRemoveWithoutError(
        clients.sysAdmin,
        servicePath,
        id.sysAdminDoc
      )
    })
  })
})
