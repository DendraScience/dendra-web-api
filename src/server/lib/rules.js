const { MembershipRole, UserRole, Visibility } = require('./utils')

const publicRules = ({ can, cannot }) => {
  // Organizations
  can('read', 'organizations', { is_enabled: true })
  can('access', 'organizations', {
    'access_levels_resolved.public_level': { $gte: Visibility.METADATA }
  })

  // Annotations
  can('read', 'annotations', { is_enabled: true })
  can('access', 'annotations', {
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
  can('graph', 'datastreams', {
    'access_levels_resolved.public_level': { $gte: Visibility.GRAPH }
  })
  can('download', 'datastreams', {
    'access_levels_resolved.public_level': { $gte: Visibility.DOWNLOAD }
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
  [MembershipRole.ADMIN]: ({ can, cannot }, { membership }) => {
    // Organizations
    can(['access', 'patch'], 'organizations', {
      _id: membership.organization_id
    })

    // Annotations
    can(['access', 'create', 'patch', 'remove'], 'annotations', {
      organization_id: membership.organization_id
    })

    // Stations
    can(['access', 'create', 'patch', 'remove'], 'stations', {
      organization_id: membership.organization_id
    })

    // Datastreams
    can(['access', 'create', 'patch', 'remove'], 'datastreams', {
      organization_id: membership.organization_id
    })
  },

  [MembershipRole.CURATOR]: ({ can, cannot }, { membership }) => {
    // Organizations
    can('access', 'organizations', {
      _id: membership.organization_id
    })

    // Annotations
    can(['access', 'create', 'patch'], 'annotations', {
      organization_id: membership.organization_id
    })

    // Stations
    can(['access', 'create', 'patch'], 'stations', {
      organization_id: membership.organization_id
    })

    // Datastreams
    can(['access', 'create', 'patch', 'graph', 'download'], 'datastreams', {
      organization_id: membership.organization_id
    })
  },

  [MembershipRole.MEMBER]: ({ can, cannot }, { membership }) => {
    // Organizations
    can('access', 'organizations', {
      'access_levels_resolved.member_level': { $gte: Visibility.METADATA },
      _id: membership.organization_id
    })

    // Annotations
    can('read', 'annotations')
    can(['create', 'patch'], 'annotations', {
      organization_id: membership.organization_id,
      state: 'pending'
    })
    can('access', 'annotations', {
      'access_levels_resolved.member_level': { $gte: Visibility.METADATA },
      organization_id: membership.organization_id
    })

    // Stations
    can('read', 'stations')
    can('access', 'stations', {
      'access_levels_resolved.member_level': { $gte: Visibility.METADATA },
      organization_id: membership.organization_id
    })

    // Datastreams
    can('read', 'datastreams')
    can('access', 'datastreams', {
      'access_levels_resolved.member_level': { $gte: Visibility.METADATA },
      organization_id: membership.organization_id
    })
    can('graph', 'datastreams', {
      'access_levels_resolved.member_level': { $gte: Visibility.GRAPH },
      organization_id: membership.organization_id
    })
    can('download', 'datastreams', {
      'access_levels_resolved.member_level': { $gte: Visibility.DOWNLOAD },
      organization_id: membership.organization_id
    })
  }
}

const userRulesByRole = {
  [UserRole.SYS_ADMIN]: ({ can, cannot }, { user }) => {
    can('manage', 'all')

    // Users
    cannot(['create', 'patch', 'update'], 'users', {
      roles: 'sys-admin',
      person_id: { $exists: true }
    })
    cannot(['create', 'patch', 'update'], 'users', {
      roles: UserRole.USER,
      person_id: { $exists: false }
    })
    cannot(['create', 'patch', 'update'], 'users', {
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

    // Annotations
    can('read', 'annotations', { is_enabled: true })
    can('access', 'annotations', {
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
    can('graph', 'datastreams', {
      'access_levels_resolved.public_level': { $gte: Visibility.GRAPH }
    })
    can('download', 'datastreams', {
      'access_levels_resolved.public_level': { $gte: Visibility.DOWNLOAD }
    })

    // Memberships
    can('read', 'memberships')

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
