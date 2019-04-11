const publicRules = ({ can, cannot }) => {
  can('read', 'vocabularies')
  can('read', 'organizations', {
    'access_levels_resolved.public_level': { $gt: 0 }
  })
}

const membershipRulesByRole = {
  admin: ({ can, cannot }, { membership }) => {},

  curator: ({ can, cannot }, { membership }) => {},

  member: ({ can, cannot }, { membership }) => {}
}

const userRulesByRole = {
  'sys-admin': ({ can, cannot }, { user }) => {
    can('manage', 'all')
    cannot('remove', 'users', { _id: user._id })
  },

  user: ({ can, cannot }, { user }) => {
    can('read', 'vocabularies')
    can('read', 'organizations', {
      'access_levels_resolved.public_level': { $gt: 0 }
    })
    can('read', 'users', { _id: user._id })
    can('patch', 'users', { _id: user._id })
  }
}

module.exports = {
  publicRules,
  membershipRulesByRole,
  userRulesByRole
}
