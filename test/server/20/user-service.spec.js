/**
 * Tests for user service
 */

const feathers = require('feathers')
const restClient = require('feathers-rest/client')
const request = require('request')

describe('Service /users', function () {
  const databases = main.app.get('databases')

  let owner

  before(function () {
    if (databases.mongodb && databases.mongodb.metadata) {
      return Promise.resolve(databases.mongodb.metadata.db).then(db => {
        return db.collection('users').remove({email: 'user_test_one@test.dendra.science'})
      })
    }
  })

  after(function () {
    if (databases.mongodb && databases.mongodb.metadata) {
      return Promise.resolve(databases.mongodb.metadata.db).then(db => {
        return db.collection('users').remove({email: 'user_test_one@test.dendra.science'})
      })
    }
  })

  let _id = '59e15f6a60e2ff2238a6fd09'

  describe('#create()', function () {
    it('guest should create without error', function () {
      return helper.loadJSON(path.join(__dirname, 'data/user_test_one.json')).then(doc => {
        return guest.service('/users').create(doc)
      }).then(doc => {
        expect(doc).to.have.property('_id')
        expect(doc).to.not.have.property('password')

        _id = doc._id
      })
    })

    it('guest should authenticate without error', function () {
      return guest.service('/authentication').create({
        email: 'user_test_one@test.dendra.science',
        password: 'abc123',
        strategy: 'local'
      }).then(doc => {
        expect(doc).to.have.property('accessToken')

        owner = feathers()
          .configure(restClient('http://localhost:3030').request(request.defaults({
            headers: {
              'Authorization': doc.accessToken
            }
          })))
      })
    })
  })

  describe('#get()', function () {
    it('guest should get with error', function () {
      let retDoc
      let retErr

      return guest.service('/users').get(_id).then(doc => {
        retDoc = doc
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retDoc).to.be.undefined
        expect(retErr).to.have.property('code', 401) // Not authenticated
      })
    })

    it('non admin should get with error', function () {
      let retDoc
      let retErr

      return nonAdmin.service('/users').get(_id).then(doc => {
        retDoc = doc
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retDoc).to.be.undefined
        expect(retErr).to.have.property('code', 403) // Forbidden
      })
    })

    it('owner should get without error', function () {
      return owner.service('/users').get(_id).then(doc => {
        expect(doc).to.have.property('_id')
        expect(doc).to.not.have.property('password')
      })
    })

    it('sys admin should get without error', function () {
      return sysAdmin.service('/users').get(_id).then(doc => {
        expect(doc).to.have.property('_id')
        expect(doc).to.not.have.property('password')
      })
    })
  })

  describe('#find()', function () {
    it('guest should find with error', function () {
      let retRes
      let retErr

      return guest.service('/users').find({query: {email: 'user_test_one@test.dendra.science'}}).then(res => {
        retRes = res
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retRes).to.be.undefined
        expect(retErr).to.have.property('code', 401) // Not authenticated
      })
    })

    it('non admin should find with error', function () {
      let retRes
      let retErr

      return nonAdmin.service('/users').find({query: {email: 'user_test_one@test.dendra.science'}}).then(res => {
        retRes = res
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retRes).to.be.undefined
        expect(retErr).to.have.property('code', 403) // Forbidden
      })
    })

    it('owner should find with error', function () {
      let retRes
      let retErr

      return owner.service('/users').find({query: {email: 'user_test_one@test.dendra.science'}}).then(res => {
        retRes = res
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retRes).to.be.undefined
        expect(retErr).to.have.property('code', 403) // Forbidden
      })
    })

    it('sys admin should find without error', function () {
      return sysAdmin.service('/users').find({query: {email: 'user_test_one@test.dendra.science'}}).then(res => {
        expect(res).to.have.property('data').lengthOf(1)
        expect(res).to.have.nested.property('data.0.name')
        expect(res).to.not.have.nested.property('data.0.password')
      })
    })
  })

  describe('#update()', function () {
    it('guest should update with error', function () {
      let retDoc
      let retErr

      return helper.loadJSON(path.join(__dirname, 'data/user_test_one.update.json')).then(doc => {
        return guest.service('/users').update(_id, doc)
      }).then(doc => {
        retDoc = doc
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retDoc).to.be.undefined
        expect(retErr).to.have.property('code', 401) // Not authenticated
      })
    })

    it('non admin should update with error', function () {
      let retDoc
      let retErr

      return helper.loadJSON(path.join(__dirname, 'data/user_test_one.update.json')).then(doc => {
        return nonAdmin.service('/users').update(_id, doc)
      }).then(doc => {
        retDoc = doc
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retDoc).to.be.undefined
        expect(retErr).to.have.property('code', 403) // Forbidden
      })
    })

    it('owner should update without error', function () {
      return helper.loadJSON(path.join(__dirname, 'data/user_test_one.update1.json')).then(doc => {
        return sysAdmin.service('/users').update(_id, doc)
      }).then(doc => {
        expect(doc).to.have.property('name', 'Test One - Updated 1')
        expect(doc).to.not.have.property('password')
      })
    })

    it('guest should authenticate with new password', function () {
      return guest.service('/authentication').create({
        email: 'user_test_one@test.dendra.science',
        password: 'def456',
        strategy: 'local'
      }).then(doc => {
        expect(doc).to.have.property('accessToken')
      })
    })

    it('sys admin should update without error', function () {
      return helper.loadJSON(path.join(__dirname, 'data/user_test_one.update2.json')).then(doc => {
        return sysAdmin.service('/users').update(_id, doc)
      }).then(doc => {
        expect(doc).to.have.property('name', 'Test One - Updated 2')
        expect(doc).to.not.have.property('password')
      })
    })

    it('guest should authenticate with same password', function () {
      return guest.service('/authentication').create({
        email: 'user_test_one@test.dendra.science',
        password: 'def456',
        strategy: 'local'
      }).then(doc => {
        expect(doc).to.have.property('accessToken')
      })
    })
  })

  describe('#remove()', function () {
    it('guest should remove with error', function () {
      let retDoc
      let retErr

      return guest.service('/users').remove(_id).then(doc => {
        retDoc = doc
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retDoc).to.be.undefined
        expect(retErr).to.have.property('code', 401) // Not authenticated
      })
    })

    it('non admin should remove with error', function () {
      let retDoc
      let retErr

      return nonAdmin.service('/users').remove(_id).then(doc => {
        retDoc = doc
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retDoc).to.be.undefined
        expect(retErr).to.have.property('code', 403) // Forbidden
      })
    })

    it('owner should remove without error', function () {
      return owner.service('/users').remove(_id).then(doc => {
        expect(doc).to.have.property('_id')
      })
    })

    it('sys admin should remove with error', function () {
      let retDoc
      let retErr

      return sysAdmin.service('/users').remove(_id).then(doc => {
        retDoc = doc
      }).catch(err => {
        retErr = err
      }).then(() => {
        expect(retDoc).to.be.undefined
        expect(retErr).to.have.property('code', 404) // Not found
      })
    })
  })
})
