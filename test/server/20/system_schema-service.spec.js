/**
 * Tests for system/schema service
 */

const findLength = 59
const servicePath = 'system/schemas'

describe(`Service ${servicePath}`, function () {
  const id = {
    doc: 'types.json'
  }

  describe('#create()', function () {
    it('guest should create with error', function () {
      return helper.shouldCreateWithError(
        clients.guest,
        servicePath,
        {},
        'MethodNotAllowed'
      )
    })

    it('user should create with error', function () {
      return helper.shouldCreateWithError(
        clients.user,
        servicePath,
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should create multiple with error', function () {
      return helper.shouldCreateWithError(
        clients.sysAdmin,
        servicePath,
        [{}, {}],
        'MethodNotAllowed'
      )
    })

    it('sys admin should create with error', function () {
      return helper.shouldCreateWithError(
        clients.sysAdmin,
        servicePath,
        {},
        'MethodNotAllowed'
      )
    })
  })

  describe('#get()', function () {
    it('guest should get without error', function () {
      return helper.shouldGetWithoutError(clients.guest, servicePath, id.doc)
    })

    it('user should get without error', function () {
      return helper.shouldGetWithoutError(clients.user, servicePath, id.doc)
    })

    it('sys admin should get without error', function () {
      return helper.shouldGetWithoutError(clients.sysAdmin, servicePath, id.doc)
    })
  })

  describe('#find()', function () {
    it('guest should find without error', function () {
      return helper.shouldFindWithoutError(
        clients.guest,
        servicePath,
        {},
        findLength,
        false
      )
    })

    it('user should find without error', function () {
      return helper.shouldFindWithoutError(
        clients.user,
        servicePath,
        {},
        findLength,
        false
      )
    })

    it('sys admin should find without error', function () {
      return helper.shouldFindWithoutError(
        clients.sysAdmin,
        servicePath,
        {},
        findLength,
        false
      )
    })
  })

  describe('#patch()', function () {
    it('guest should patch with error', function () {
      return helper.shouldPatchWithError(
        clients.guest,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('user should patch with error', function () {
      return helper.shouldPatchWithError(
        clients.user,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should patch multiple with error', function () {
      return helper.shouldPatchMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.doc },
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should patch with error', function () {
      return helper.shouldPatchWithError(
        clients.sysAdmin,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })
  })

  describe('#update()', function () {
    it('guest should update with error', function () {
      return helper.shouldUpdateWithError(
        clients.guest,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('user should update with error', function () {
      return helper.shouldUpdateWithError(
        clients.user,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should update multiple with error', function () {
      return helper.shouldUpdateMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.doc },
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should update with error', function () {
      return helper.shouldUpdateWithError(
        clients.sysAdmin,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })
  })

  describe('#remove()', function () {
    it('guest should remove with error', function () {
      return helper.shouldRemoveWithError(
        clients.guest,
        servicePath,
        id.doc,
        'MethodNotAllowed'
      )
    })

    it('user should remove with error', function () {
      return helper.shouldRemoveWithError(
        clients.user,
        servicePath,
        id.doc,
        'MethodNotAllowed'
      )
    })

    it('sys admin should remove multiple with error', function () {
      return helper.shouldRemoveMultipleWithError(
        clients.sysAdmin,
        servicePath,
        { _id: id.doc },
        'MethodNotAllowed'
      )
    })

    it('sys admin should remove with error', function () {
      return helper.shouldRemoveWithError(
        clients.sysAdmin,
        servicePath,
        id.doc,
        'MethodNotAllowed'
      )
    })
  })
})
