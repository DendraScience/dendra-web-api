/**
 * Tests for system/timezone service
 */

const findLength = 592
const servicePath = 'system/timezones'

describe(`Service ${servicePath}`, function() {
  const id = {
    doc: 'America/Los_Angeles'
  }

  describe('#create()', function() {
    it('guest should create with error', function() {
      return helper.shouldCreateWithError(
        conn.guest,
        servicePath,
        {},
        'MethodNotAllowed'
      )
    })

    it('user should create with error', function() {
      return helper.shouldCreateWithError(
        conn.user,
        servicePath,
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should create multiple with error', function() {
      return helper.shouldCreateWithError(
        conn.sysAdmin,
        servicePath,
        [{}, {}],
        'MethodNotAllowed'
      )
    })

    it('sys admin should create with error', function() {
      return helper.shouldCreateWithError(
        conn.sysAdmin,
        servicePath,
        {},
        'MethodNotAllowed'
      )
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
      return helper.shouldFindWithoutError(
        conn.guest,
        servicePath,
        {},
        findLength,
        false
      )
    })

    it('user should find without error', function() {
      return helper.shouldFindWithoutError(
        conn.user,
        servicePath,
        {},
        findLength,
        false
      )
    })

    it('sys admin should find without error', function() {
      return helper.shouldFindWithoutError(
        conn.sysAdmin,
        servicePath,
        {},
        findLength,
        false
      )
    })
  })

  describe('#patch()', function() {
    it('guest should patch with error', function() {
      return helper.shouldPatchWithError(
        conn.guest,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('user should patch with error', function() {
      return helper.shouldPatchWithError(
        conn.user,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should patch multiple with error', function() {
      return helper.shouldPatchMultipleWithError(
        conn.sysAdmin,
        servicePath,
        { _id: id.doc },
        {},
        'MethodNotAllowed'
      )
    })

    it('ys admin should patch with error', function() {
      return helper.shouldPatchWithError(
        conn.sysAdmin,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })
  })

  describe('#update()', function() {
    it('guest should update with error', function() {
      return helper.shouldUpdateWithError(
        conn.guest,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('user should update with error', function() {
      return helper.shouldUpdateWithError(
        conn.user,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should update multiple with error', function() {
      return helper.shouldUpdateMultipleWithError(
        conn.sysAdmin,
        servicePath,
        { _id: id.doc },
        {},
        'MethodNotAllowed'
      )
    })

    it('sys admin should update with error', function() {
      return helper.shouldUpdateWithError(
        conn.sysAdmin,
        servicePath,
        id.doc,
        {},
        'MethodNotAllowed'
      )
    })
  })

  describe('#remove()', function() {
    it('guest should remove with error', function() {
      return helper.shouldRemoveWithError(
        conn.guest,
        servicePath,
        id.doc,
        'MethodNotAllowed'
      )
    })

    it('user should remove with error', function() {
      return helper.shouldRemoveWithError(
        conn.user,
        servicePath,
        id.doc,
        'MethodNotAllowed'
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

    it('sys admin should remove with error', function() {
      return helper.shouldRemoveWithError(
        conn.sysAdmin,
        servicePath,
        id.doc,
        'MethodNotAllowed'
      )
    })
  })
})
