const { UserRole, Visibility } = require('./utils')

const publicRules = ({ can, cannot }) => {
  // Organizations
  can('read', 'organizations', { is_enabled: true })
  can('access', 'organizations', {
    'access_levels_resolved.public_level': { $gte: Visibility.METADATA }
  })

  // Stations
  can('read', 'stations', { is_enabled: true })
  can('access', 'stations', {
    'access_levels_resolved.public_level': { $gte: Visibility.METADATA }
  })

  // Datastreams
  can('read', 'datastreams', { is_enabled: true })
  can('access', 'datastreams', {
    'access_levels_resolved.public_level': { $gte: Visibility.METADATA }
  })

  // Persons
  can('read', 'persons', { is_enabled: true })

  // Places
  can('read', 'places', { is_enabled: true })

  // Schemes
  can('read', 'schemes', { is_enabled: true })

  // Vocabularies
  can('read', 'vocabularies', { is_enabled: true })

  // SOMs
  can('read', 'soms')

  // UOMs
  can('read', 'uoms')
}

const membershipRulesByRole = {
  admin: ({ can, cannot }, { membership }) => {},

  curator: ({ can, cannot }, { membership }) => {},

  member: ({ can, cannot }, { membership }) => {}
}

const userRulesByRole = {
  [UserRole.SYS_ADMIN]: ({ can, cannot }, { user }) => {
    can('manage', 'all')

    // Users
    cannot('save', 'users', {
      roles: 'sys-admin',
      person_id: { $exists: true }
    })
    cannot('save', 'users', {
      roles: UserRole.USER,
      person_id: { $exists: false }
    })
    cannot('save', 'users', {
      _id: user._id,
      roles: { $ne: UserRole.SYS_ADMIN }
    })
    cannot('remove', 'users', { _id: user._id })
  },

  [UserRole.USER]: ({ can, cannot }, { user }) => {
    // Organizations
    can('read', 'organizations', { is_enabled: true })
    can('access', 'organizations', {
      'access_levels_resolved.public_level': { $gte: Visibility.METADATA }
    })

    // Stations
    can('read', 'stations', { is_enabled: true })
    can('access', 'stations', {
      'access_levels_resolved.public_level': { $gte: Visibility.METADATA }
    })

    // Datastreams
    can('read', 'datastreams', { is_enabled: true })
    can('access', 'datastreams', {
      'access_levels_resolved.public_level': { $gte: Visibility.METADATA }
    })

    // Persons
    can('read', 'persons', { is_enabled: true })
    can('patch', 'persons', { _id: user.person_id, is_enabled: true })
    can('assign', 'persons')
    cannot('assign', 'persons', ['$set.is_enabled'])

    // Places
    can('read', 'places', { is_enabled: true })

    // Schemes
    can('read', 'schemes', { is_enabled: true })

    // Vocabularies
    can('read', 'vocabularies', { is_enabled: true })

    // SOMs
    can('read', 'soms')

    // UOMs
    can('read', 'uoms')

    // Users
    can('read', 'users', { _id: user._id, is_enabled: true })
    can('patch', 'users', { _id: user._id, is_enabled: true })
    can('assign', 'users')
    cannot('assign', 'users', [
      '$set.is_enabled',
      '$set.person_id',
      '$set.roles',
      '$unset.person_id'
    ])
  }
}

module.exports = {
  publicRules,
  membershipRulesByRole,
  userRulesByRole
}
