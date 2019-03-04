/**
 * Tests for annotation service
 */

describe('Service /annotations', function () {
  const databases = main.app.get('databases')

  before(function () {
    if (databases.mongodb && databases.mongodb.metadata) {
      return Promise.resolve(databases.mongodb.metadata.db).then(db => {
        return db.collection('annotations').remove({created_by_name: 'Test One Annotation Creator'})
      })
    }
  })

  after(function () {
    if (databases.mongodb && databases.mongodb.metadata) {
      return Promise.resolve(databases.mongodb.metadata.db).then(db => {
        return db.collection('annotations').remove({created_by_name: 'Test One Annotation Creator'})
      })
    }
  })

  let _id

  describe('#create()', function () {
    it('should create without error', function () {
      return helper.loadJSON(path.join(__dirname, 'data/annotation_test_one.json')).then(doc => {
        return sysAdmin.service('/annotations').create(doc)
      }).then(doc => {
        expect(doc).to.have.property('_id')

        _id = doc._id
      })
    })
  })

  describe('#get()', function () {
    it('should get without error', function () {
      return guest.service('/annotations').get(_id).then(doc => {
        expect(doc).to.have.property('_id')
      })
    })
  })

  describe('#find()', function () {
    it('should find without error', function () {
      return guest.service('/annotations').find({query: {created_by_name: 'Test One Annotation Creator'}}).then(res => {
        expect(res).to.have.property('data').lengthOf(1)
      })
    })
  })

  describe('#update()', function () {
    it('should update without error', function () {
      return helper.loadJSON(path.join(__dirname, 'data/annotation_test_one.update.json')).then(doc => {
        return sysAdmin.service('/annotations').update(_id, doc)
      }).then(doc => {
        expect(doc).to.have.property('title', 'Test One Annotation - Updated')
      })
    })
  })

  describe('#remove()', function () {
    it('should remove without error', function () {
      return sysAdmin.service('/annotations').remove(_id).then(doc => {
        expect(doc).to.have.property('_id')
      })
    })
  })
})
