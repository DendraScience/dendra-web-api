"use strict";

const {
  defineAbilityForContext
} = require('../lib/ability');

module.exports = () => {
  return async context => {
    if (context.type !== 'before') {
      throw new Error("The 'setAbility' hook should only be used as a 'before' hook.");
    }

    if (!context.params.ability) context.params.ability = await defineAbilityForContext(context);
    return context;
  };
};