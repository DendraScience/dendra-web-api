"use strict";

const {
  Ability,
  AbilityBuilder
} = require('@casl/ability');

const {
  publicRules,
  membershipRulesByRole,
  userRulesByRole
} = require('./rules');

const TYPE_KEY = Symbol.for('type');
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
    }));

    if (user.person_id) {
      const memberships = await context.app.service('memberships').find({
        paginate: false,
        query: {
          person_id: user.person_id,
          $select: ['_id', 'organization_id', 'roles']
        }
      });
      memberships.forEach(membership => {
        membership.roles.forEach(role => membershipRulesByRole[role](extract, {
          membership
        }));
      });
    }
  }

  return new Ability(extract.rules, {
    subjectName
  });
}

module.exports = {
  defineAbilityForContext,
  TYPE_KEY
};