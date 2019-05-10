"use strict";

const {
  Ability,
  AbilityBuilder
} = require('@casl/ability');

const {
  publicRules,
  userRulesByRole
} = require('./rules');

const TYPE_KEY = Symbol.for('type');
Ability.addAlias('save', ['create', 'patch', 'update']);
Ability.addAlias('read', ['get', 'find']);
Ability.addAlias('delete', 'remove');

function subjectName(subject) {
  if (!subject || typeof subject === 'string') {
    return subject;
  }

  return subject[TYPE_KEY];
}

async function defineAbilityForContext(context) {
  const extract = AbilityBuilder.extract();
  const {
    user
  } = context.params;

  if (!user) {
    publicRules(extract);
  } else {
    user.roles.forEach(role => userRulesByRole[role](extract, {
      user
    })); // const memberships = await context.app.service('memberships').find({
    //   paginate: false,
    //   query: {
    //     person_id: user.person_id,
    //     $limit: 200,
    //     $select: ['_id', 'organization_id', 'roles']
    //   }
    // })
    // memberships.forEach(membership => {
    //   membership.roles.forEach(role => {
    //     if (role === 'admin') {
    //       can('read', 'organizations', { _id: membership.organization_id })
    //       can('patch', 'organizations', { _id: membership.organization_id })
    //     } else if (role === 'curator') {
    //       can('read', 'organizations', { _id: membership.organization_id })
    //     } else if (role === 'member') {
    //       can('read', 'organizations', {
    //         _id: membership.organization_id,
    //         'access_levels_resolved.member_level': { $gt: 0 }
    //       })
    //     }
    //   })
    // })
  }

  return new Ability(extract.rules, {
    subjectName
  });
}

module.exports = {
  defineAbilityForContext,
  TYPE_KEY
};