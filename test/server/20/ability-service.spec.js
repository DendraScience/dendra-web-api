/**
 * Tests for ability service
 */

const servicePath = 'ability'

describe(`Service ${servicePath}`, function() {
  describe('#get()', function() {
    it('guest should get without error', function() {
      return helper
        .shouldGetWithoutError(clients.guest, servicePath, 'current')
        .then(({ retDoc }) => {
          expect(retDoc).to.have.property('rules')
        })
    })
  })
})
