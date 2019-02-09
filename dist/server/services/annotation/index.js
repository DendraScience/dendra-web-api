'use strict';

const service = require('feathers-mongodb');
const hooks = require('./hooks');

module.exports = function () {
  return function () {
    const app = this;
    const databases = app.get('databases');

    if (databases.mongodb && databases.mongodb.metadata) {
      app.set('serviceReady', Promise.resolve(databases.mongodb.metadata.db).then(db => {
        app.use('/annotations', service({
          Model: db.collection('annotations'),
          paginate: databases.mongodb.metadata.paginate
        }));

        // Get the wrapped service object, bind hooks
        const annotationService = app.service('/annotations');

        annotationService.before(hooks.before);
        annotationService.after(hooks.after);
      }));
    }
  };
}();