const publicRules = ({ can, cannot }) => {
  // Organizations
  can('read', 'organizations', { is_enabled: true })
  can('access', 'organizations', {
    'access_levels_resolved.public_level': { $gt: 0 }
  })

  // Persons
  can('read', 'persons', { is_enabled: true })

  // Places
  can('read', 'places', { is_enabled: true })

  // Schemes
  can('read', 'schemes', { is_enabled: true })

  // SOMs
  can('read', 'soms')

  // UOMs
  can('read', 'uoms')

  // Vocabularies
  can('read', 'vocabularies', { is_enabled: true })
}

const membershipRulesByRole = {
  admin: ({ can, cannot }, { membership }) => {},

  curator: ({ can, cannot }, { membership }) => {},

  member: ({ can, cannot }, { membership }) => {}
}

const userRulesByRole = {
  'sys-admin': ({ can, cannot }, { user }) => {
    can('manage', 'all')

    // Users
    cannot('remove', 'users', { _id: user._id })
  },

  user: ({ can, cannot }, { user }) => {
    // Organizations
    can('read', 'organizations', { is_enabled: true })
    can('access', 'organizations', {
      'access_levels_resolved.public_level': { $gt: 0 }
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

    // Vocabularies
    can('read', 'vocabularies', { is_enabled: true })
  }
}

module.exports = {
  publicRules,
  membershipRulesByRole,
  userRulesByRole
}
