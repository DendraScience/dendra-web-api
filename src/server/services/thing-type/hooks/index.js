const globalHooks = require('../../../hooks')
const _ = require('lodash')

const defaultsMigrations = rec => {
  _.defaults(
    rec,
    {
      is_enabled: rec.enabled
    },
    {
      is_enabled: true
    }
  )

  delete rec.enabled
  delete rec.oem_company_lookup
  delete rec.reseller_company_lookup
}

const stages = [
  {
    $lookup: {
      from: 'companies',
      localField: 'oem_company_id',
      foreignField: '_id',
      as: 'oem_company'
    }
  },
  {
    $unwind: { path: '$oem_company', preserveNullAndEmptyArrays: true }
  },
  {
    $lookup: {
      from: 'companies',
      localField: 'reseller_company_id',
      foreignField: '_id',
      as: 'reseller_company'
    }
  },
  {
    $unwind: { path: '$reseller_company', preserveNullAndEmptyArrays: true }
  },
  {
    $addFields: {
      oem_company_lookup: {
        name: '$oem_company.name'
      },
      reseller_company_lookup: {
        name: '$reseller_company.name'
      }
    }
  },
  {
    $project: {
      oem_company: false,
      reseller_company: false
    }
  }
]

exports.before = {
  // all: [],

  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],

  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],

  create: globalHooks.beforeCreate({
    alterItems: defaultsMigrations,
    schemaName: 'thing-type.create.json',
    versionStamp: true
  }),

  update: globalHooks.beforeUpdate({
    alterItems: defaultsMigrations,
    schemaName: 'thing-type.update.json',
    versionStamp: true
  }),

  patch: globalHooks.beforePatch({
    schemaName: 'thing-type.patch.json',
    versionStamp: true
  }),

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
