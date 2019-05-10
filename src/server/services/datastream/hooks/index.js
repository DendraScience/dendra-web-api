const errors = require('@feathersjs/errors')
const globalHooks = require('../../../hooks')
const _ = require('lodash')

const defaultsMigrations = rec => {
  let terms

  // Convert 1.x tags array to 2.x terms object
  if (Array.isArray(rec.tags)) {
    terms = rec.tags.reduce((obj, tag) => {
      const parts = tag.split('_')
      const value = parts.pop()

      if (parts.length) {
        _.set(obj, parts.join('.'), value)
      } else {
        obj[value] = true
      }
      return obj
    }, {})
  }

  _.defaults(
    rec,
    {
      is_enabled: rec.enabled,
      terms
    },
    {
      is_enabled: true,
      is_geo_protected: false,
      is_hidden: false,
      state: 'ready'
    }
  )

  delete rec.attributes_info
  delete rec.convertible_to_uoms
  delete rec.enabled
  delete rec.members
  delete rec.preferred_uoms
  delete rec.tags
  delete rec.tags_info
  delete rec.uom
  delete rec.urls
}

const setTermsInfo = async context => {
  const data = context.method === 'patch' ? context.data.$set : context.data

  if (!(data && data.terms)) return context

  const { terms } = data
  const schemeIds = Object.keys(terms).sort()
  const info = (data.terms_info = {
    class_keys: [],
    class_tags: []
  })

  // TODO: Implement caching
  const vocabularies = (await context.app
    .service('vocabularies')
    .find(
      { is_enabled: true, scheme_id: { $in: schemeIds } },
      { provider: null }
    )).data

  schemeIds.forEach(schemeId => {
    const keys = [schemeId]
    const spec = terms[schemeId]

    Object.keys(spec)
      .sort()
      .forEach(vLabel => {
        const tLabel = spec[vLabel]

        const vocabulary = vocabularies.find(
          v => v.scheme_id === schemeId && v.label === vLabel
        )
        if (!vocabulary)
          throw new errors.BadRequest(
            `No vocabulary found for '${schemeId}.${vLabel}'.`
          )

        const term = vocabulary.terms.find(t => t.label === tLabel)
        if (!term)
          throw new errors.BadRequest(
            `No vocabulary term found for '${schemeId}.${vLabel}.${tLabel}'.`
          )

        const key = `${vLabel}_${tLabel}`
        const tag = `${schemeId}_${key}`

        switch (vocabulary.vocabulary_type) {
          case 'class':
            info.class_tags.push(tag)
            keys.push(key)
            break

          case 'unit':
            if (info.unit_tag)
              throw new errors.BadRequest(
                `You are not allowed to specify more than one unit term.`
              )

            info.unit_tag = tag
            break
        }
      })

    if (keys.length > 1) info.class_keys.push(keys.join('__'))
  })

  return context
}

const stages = [
  {
    $lookup: {
      from: 'organizations',
      localField: 'organization_id',
      foreignField: '_id',
      as: 'organization'
    }
  },
  {
    $unwind: { path: '$organization', preserveNullAndEmptyArrays: true }
  },
  {
    $lookup: {
      from: 'stations',
      localField: 'station_id',
      foreignField: '_id',
      as: 'station'
    }
  },
  {
    $unwind: { path: '$station', preserveNullAndEmptyArrays: true }
  },
  {
    $addFields: {
      access_levels_resolved: {
        $mergeObjects: [
          {
            member_level: 1,
            public_level: 1
          },
          '$organization.access_levels',
          '$station.access_levels',
          '$access_levels'
        ]
      }
    }
  },
  {
    $project: {
      organization: false,
      station: false
    }
  }
]

exports.before = {
  // all: [],

  find: [globalHooks.beforeFind(), globalHooks.accessFind(stages)],

  get: [globalHooks.beforeGet(), globalHooks.accessGet(stages)],

  create: [
    globalHooks.beforeCreate({
      alterItems: defaultsMigrations,
      schemaName: 'datastream.create.json',
      versionStamp: true
    }),

    setTermsInfo
  ],

  update: [
    globalHooks.beforeUpdate({
      alterItems: defaultsMigrations,
      schemaName: 'datastream.update.json',
      versionStamp: true
    }),

    ({ data, params }) => {
      if (params.before) {
        data.created_at = params.before.created_at
        data.created_by = params.before.created_by
      }
    },

    setTermsInfo
  ],

  patch: [
    globalHooks.beforePatch({
      schemaName: 'datastream.patch.json',
      versionStamp: true
    }),

    setTermsInfo
  ],

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
