"use strict";

const globalHooks = require('../../../hooks');

const {
  Visibility
} = require('../../../lib/utils');

const _ = require('lodash');

const defaultsMigrations = rec => {
  _.defaults(rec, {
    is_enabled: rec.enabled
  }, {
    is_enabled: true,
    state: 'pending'
  });

  delete rec.access_levels_resolved;
  delete rec.enabled;
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

const dispatchAnnotationBuild = async context => {
  const now = new Date();
  const method = 'processAnnotation';
  const connection = context.app.get('connections').annotationDispatch;
  if (!connection) return context;
  await connection.app.service('annotation-builds').create({
    _id: `${method}-${context.result._id}-${now.getTime()}-${Math.floor(Math.random() * 10000)}`,
    method,
    dispatch_at: now,
    expires_at: new Date(now.getTime() + 86400000),
    // 24 hours from now
    spec: {
      annotation: context.result,
      annotation_before: context.params.before || {}
    }
  });
  return context;
};

const dispatchAnnotationBuildKeys = ['actions', 'datastream_ids', 'intervals', 'is_enabled', 'state', 'station_ids'];
exports.before = {
  // all: [],
  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],
  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],
  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'annotation.create.json',
    versionStamp: true
  }),
  update: [globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'annotation.update.json',
    versionStamp: true
  }), ({
    data,
    params
  }) => {
    if (params.before) {
      data.created_at = params.before.created_at;
      data.created_by = params.before.created_by;
    }
  }],
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
  create: dispatchAnnotationBuild,
  update: dispatchAnnotationBuild,
  patch: context => {
    if (context.data.$set && Object.keys(context.data.$set).includes(dispatchAnnotationBuildKeys) || context.data.$unset && Object.keys(context.data.$unset).includes(dispatchAnnotationBuildKeys)) return dispatchAnnotationBuild(context);
  },
  remove: dispatchAnnotationBuild
};