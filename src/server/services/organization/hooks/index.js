const globalHooks = require('../../../hooks')
const { Visibility } = require('../../../lib/utils')
const _ = require('lodash')

const defaultsMigrations = rec => {
  _.defaults(
    rec,
    {
      is_enabled: rec.enabled
    },
    {
      is_enabled: true,
      sort_value: 0
    }
  )

  delete rec.access_levels_resolved
  delete rec.enabled
  delete rec.general_config_resolved
}

const stages = [
  {
    $addFields: {
      access_levels_resolved: {
        $mergeObjects: [
          {
            member_level: Visibility.DOWNLOAD,
            public_level: Visibility.DOWNLOAD
          },
          '$access_levels'
        ]
      },
      general_config_resolved: {
        $mergeObjects: [{}, '$general_config']
      }
    }
  }
]

exports.before = {
  // all: [],

  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],

  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],

  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'organization.create.json'
  }),

  update: [
    globalHooks.beforeUpdate({
      alterItems: defaultsMigrations,
      schemaName: 'organization.update.json'
    }),

    ({ data, params }) => {
      if (params.before) {
        data.created_at = params.before.created_at
        data.created_by = params.before.created_by
      }
    }
  ],

  patch: globalHooks.beforePatch({ schemaName: 'organization.patch.json' }),

  remove: globalHooks.beforeRemove()
}

exports.after = {
  // all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
}
