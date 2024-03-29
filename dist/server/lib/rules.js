"use strict";

const {
  MembershipRole,
  UserRole,
  Visibility
} = require('./utils');
const publicRules = ({
  can,
  cannot
}) => {
  // Organizations
  can('read', 'organizations');
  can('access', 'organizations', {
    'access_levels_resolved.public_level': {
      $gte: Visibility.METADATA
    }
  });

  // Annotations
  can('read', 'annotations');
  can('access', 'annotations', {
    'access_levels_resolved.public_level': {
      $gte: Visibility.METADATA
    }
  });

  // Stations
  can('read', 'stations');
  can('access', 'stations', {
    'access_levels_resolved.public_level': {
      $gte: Visibility.METADATA
    }
  });

  // Datastreams
  can('read', 'datastreams');
  can('access', 'datastreams', {
    'access_levels_resolved.public_level': {
      $gte: Visibility.METADATA
    }
  });
  can('graph', ['datastreams', 'stations', 'organizations'], {
    'access_levels_resolved.public_level': {
      $gte: Visibility.GRAPH
    }
  });
  can('download', ['datastreams', 'stations', 'organizations'], {
    'access_levels_resolved.public_level': {
      $gte: Visibility.DOWNLOAD
    }
  });

  // Monitors
  can('read', 'monitors');

  // Persons
  can('read', 'persons');

  // Places
  can('read', 'places');

  // Companies
  can('read', 'companies');

  // Thing Types
  can('read', 'thing-types');
  can('access', 'thing-types', {});

  // Schemes
  can('read', 'schemes');

  // Vocabularies
  can('read', 'vocabularies');

  // SOMs
  can('read', 'soms');

  // UOMs
  can('read', 'uoms');
};
const membershipRulesByRole = {
  [MembershipRole.ADMIN]: ({
    can,
    cannot
  }, {
    membership,
    user
  }) => {
    // Organizations
    can(['access', 'patch', 'graph', 'download'], 'organizations', {
      _id: membership.organization_id
    });
    can('assign', 'organizations');

    // Annotations
    can(['access', 'create', 'patch', 'delete', 'update'], 'annotations', {
      organization_id: membership.organization_id
    });
    can('assign', 'annotations');

    // Stations
    can(['access', 'create', 'patch', 'delete', 'update', 'graph', 'download'], 'stations', {
      organization_id: membership.organization_id
    });
    can('assign', 'stations');

    // Datastreams
    can(['access', 'create', 'patch', 'delete', 'update', 'graph', 'download'], 'datastreams', {
      organization_id: membership.organization_id
    });
    can('assign', 'datastreams');

    // Memberships
    can(['create', 'patch', 'delete'], 'memberships', {
      organization_id: membership.organization_id
    });
    can('assign', 'memberships');
    cannot(['create', 'delete'], 'memberships', {
      organization_id: membership.organization_id,
      person_id: membership.person_id
    });
    cannot('patch', 'memberships', {
      organization_id: membership.organization_id,
      person_id: membership.person_id,
      roles: {
        $ne: MembershipRole.ADMIN
      }
    });

    // Uploads
    can(['read'], 'uploads', {
      organization_id: membership.organization_id
    });
    can(['create'], 'uploads', {
      is_active: false,
      is_cancel_requested: false,
      organization_id: membership.organization_id,
      state: 'pending'
    });
    can(['patch'], 'uploads', {
      created_by: user._id,
      organization_id: membership.organization_id
    });
    can('assign', 'uploads', ['$set.version_id']);
    can('assign', 'uploads', ['$set.is_cancel_requested'], {
      state: 'running'
    });
    can('assign', 'uploads', ['$set.is_active', '$set.spec'], {
      is_active: false,
      state: {
        $in: ['completed', 'error', 'pending']
      }
    });

    // Companies
    can(['create', 'patch'], 'companies');
    can('assign', 'companies');

    // Thing Types
    can(['create', 'patch'], 'thing-types');
    can('assign', 'thing-types');
  },
  [MembershipRole.CURATOR]: ({
    can,
    cannot
  }, {
    membership
  }) => {
    // Organizations
    can(['access', 'graph', 'download'], 'organizations', {
      _id: membership.organization_id
    });

    // Annotations
    can(['access', 'create', 'patch'], 'annotations', {
      organization_id: membership.organization_id
    });
    can('assign', 'annotations');

    // Stations
    can(['access', 'create', 'patch', 'graph', 'download'], 'stations', {
      organization_id: membership.organization_id
    });
    can('assign', 'stations');

    // Datastreams
    can(['access', 'create', 'patch', 'graph', 'download'], 'datastreams', {
      organization_id: membership.organization_id
    });
    can('assign', 'datastreams');

    // Uploads
    can('read', 'uploads', {
      organization_id: membership.organization_id
    });
  },
  [MembershipRole.MEMBER]: ({
    can,
    cannot
  }, {
    membership
  }) => {
    // Organizations
    can('access', 'organizations', {
      'access_levels_resolved.member_level': {
        $gte: Visibility.METADATA
      },
      _id: membership.organization_id
    });
    can('graph', 'organizations', {
      'access_levels_resolved.member_level': {
        $gte: Visibility.GRAPH
      },
      _id: membership.organization_id
    });
    can('download', 'organizations', {
      'access_levels_resolved.member_level': {
        $gte: Visibility.DOWNLOAD
      },
      _id: membership.organization_id
    });

    // Annotations
    can('access', 'annotations', {
      'access_levels_resolved.member_level': {
        $gte: Visibility.METADATA
      },
      organization_id: membership.organization_id
    });
    can(['create', 'patch'], 'annotations', {
      organization_id: membership.organization_id,
      state: 'pending'
    });
    can('assign', 'annotations');
    cannot('assign', 'annotations', ['$set.is_enabled', '$set.is_hidden', '$set.state']);

    // Stations
    can('access', 'stations', {
      'access_levels_resolved.member_level': {
        $gte: Visibility.METADATA
      },
      organization_id: membership.organization_id
    });

    // Datastreams
    can('access', 'datastreams', {
      'access_levels_resolved.member_level': {
        $gte: Visibility.METADATA
      },
      organization_id: membership.organization_id
    });
    can('graph', ['datastreams', 'stations'], {
      'access_levels_resolved.member_level': {
        $gte: Visibility.GRAPH
      },
      organization_id: membership.organization_id
    });
    can('download', ['datastreams', 'stations'], {
      'access_levels_resolved.member_level': {
        $gte: Visibility.DOWNLOAD
      },
      organization_id: membership.organization_id
    });
  }
};
const userRulesByRole = {
  [UserRole.SYS_ADMIN]: ({
    can,
    cannot
  }, {
    user
  }) => {
    can('manage', 'all');

    // Users
    cannot(['create', 'patch', 'update'], 'users', {
      roles: UserRole.SYS_ADMIN,
      person_id: {
        $exists: true
      }
    });
    cannot(['create', 'patch', 'update'], 'users', {
      roles: UserRole.MANAGER,
      person_id: {
        $exists: false
      }
    });
    cannot(['create', 'patch', 'update'], 'users', {
      roles: UserRole.USER,
      person_id: {
        $exists: false
      }
    });
    cannot(['create', 'patch', 'update'], 'users', {
      _id: user._id,
      roles: {
        $ne: UserRole.SYS_ADMIN
      }
    });
    cannot(['create', 'patch', 'update'], 'users', {
      _id: user._id,
      is_enabled: false
    });
    cannot('delete', 'users', {
      _id: user._id
    });
  },
  [UserRole.MANAGER]: ({
    can,
    cannot
  }, {
    user
  }) => {
    can(['access', 'read'], 'all');
    can(['graph', 'download'], ['organizations', 'stations', 'datastreams']);
    can(['assign', 'create', 'patch', 'delete', 'update'], ['annotations', 'companies', 'datastreams', 'memberships', 'organizations', 'stations', 'thing-types']);
    can(['assign', 'create', 'patch'], ['persons', 'users']);

    // Users
    cannot(['create', 'patch'], 'users', {
      roles: UserRole.SYS_ADMIN
    });
    cannot(['create', 'patch'], 'users', {
      roles: UserRole.MANAGER,
      person_id: {
        $exists: false
      }
    });
    cannot(['create', 'patch'], 'users', {
      roles: UserRole.USER,
      person_id: {
        $exists: false
      }
    });
    cannot(['create', 'patch'], 'users', {
      _id: user._id,
      roles: {
        $ne: UserRole.MANAGER
      }
    });
    cannot(['create', 'patch'], 'users', {
      _id: user._id,
      is_enabled: false
    });
  },
  [UserRole.USER]: (extract, {
    user
  }) => {
    const {
      can,
      cannot
    } = extract;

    // Start with public rules
    publicRules(extract);

    // Memberships
    can('read', 'memberships');

    // Persons
    can('patch', 'persons', {
      _id: user.person_id,
      is_enabled: true
    });
    can('assign', 'persons');
    cannot('assign', 'persons', ['$set.is_enabled']);

    // Downloads
    can('create', 'downloads');
    can('read', 'downloads', {
      created_by: user._id
    });
    can('patch', 'downloads', {
      created_by: user._id
    });
    can('assign', 'downloads');

    // Users
    can('read', 'users');
    can('patch', 'users', {
      _id: user._id,
      is_enabled: true
    });
    can('assign', 'users');
    cannot('assign', 'users', ['$set.is_enabled', '$set.person_id', '$set.roles', '$unset.person_id']);
  }
};
module.exports = {
  publicRules,
  membershipRulesByRole,
  userRulesByRole
};