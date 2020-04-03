"use strict";

const globalHooks = require('../../../hooks');

const {
  iff
} = require('feathers-hooks-common');

const {
  idRandom,
  Visibility
} = require('../../../lib/utils');

const _ = require('lodash');

const processAnnotationKeys = ['actions', 'datastream_ids', 'intervals', 'is_enabled', 'state', 'station_ids'];

const defaultsMigrations = rec => {
  _.defaults(rec, {
    is_enabled: rec.enabled
  }, {
    is_enabled: true,
    state: 'pending'
  });

  delete rec.access_levels_resolved;
  delete rec.affected_station_ids;
  delete rec.enabled;
};

const dispatchAnnotationBuild = method => {
  return async context => {
    const connection = context.app.get('connections').annotationDispatch;
    if (!(connection && method)) return context;
    const now = new Date();
    const before = context.params.before || {};
    const annotation = context.result;
    const {
      _id: id
    } = annotation;
    await connection.app.service('annotation-builds').create({
      _id: `${method}-${id}-${now.getTime()}-${idRandom()}`,
      method,
      dispatch_at: now,
      dispatch_key: id,
      expires_at: new Date(now.getTime() + 86400000),
      // 24 hours from now
      spec: {
        annotation,
        annotation_before: before
      }
    });
    return context;
  };
};

const stages = [{
  $lookup: {
    from: 'organizations',
    localField: 'organization_id',
    foreignField: '_id',
    as: 'organization'
  }
}, {
  $unwind: {
    path: '$organization',
    preserveNullAndEmptyArrays: true
  }
}, {
  $addFields: {
    access_levels_resolved: {
      $mergeObjects: [{
        member_level: Visibility.DOWNLOAD,
        public_level: Visibility.DOWNLOAD
      }, '$organization.access_levels']
    }
  }
}, {
  $project: {
    organization: false
  }
}];
exports.before = {
  // all: [],
  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],
  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],
  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'annotation.create.json',
    versionStamp: true
  }),
  update: globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'annotation.update.json',
    versionStamp: true
  }),
  patch: globalHooks.beforePatch({
    schemaName: 'annotation.patch.json',
    versionStamp: true
  }),
  remove: globalHooks.beforeRemove()
};
exports.after = {
  // all: [],
  // find: [],
  // get: [],
  create: dispatchAnnotationBuild('processAnnotation'),
  update: dispatchAnnotationBuild('processAnnotation'),
  patch: iff(({
    data
  }) => data.$set && _.intersection(processAnnotationKeys, Object.keys(data.$set)).length || data.$unset && _.intersection(processAnnotationKeys, Object.keys(data.$unset)).length, dispatchAnnotationBuild('processAnnotation')),
  remove: dispatchAnnotationBuild('processAnnotation')
};