/**
 * Tests for system/time service
 */

const servicePath = 'system/time'

describe(`Service ${servicePath}`, function () {
  const id = {
    doc: 'America/Los_Angeles'
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
      return helper
        .shouldGetWithoutError(clients.guest, servicePath, id.doc)
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('now')
        })
    })

    it('user should get without error', function () {
      return helper
        .shouldGetWithoutError(clients.user, servicePath, id.doc)
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('now')
        })
    })

    it('sys admin should get without error', function () {
      return helper
        .shouldGetWithoutError(clients.sysAdmin, servicePath, id.doc)
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('now')
        })
    })
  })

  describe('#find()', function () {
    it('guest should find with error', function () {
      return helper.shouldFindWithError(
        clients.guest,
        servicePath,
        {},
        'MethodNotAllowed'
      )
    })

    it('user should find with error', function () {
      return helper.shouldFindWithError(
        clients.user,
        servicePath,
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should find with error', function () {
      return helper.shouldFindWithError(
        clients.sysAdmin,
        servicePath,
        {},
        'MethodNotAllowed'
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
