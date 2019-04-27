"use strict";

const {
  defineAbilityForContext
} = require('../lib/ability');

module.exports = () => {
  return async context => {
    if (context.type !== 'before') {
      throw new Error("The 'setAbility' hook should only be used as a 'before' hook.");
    } // TODO: Use an LRU cache! (https://stalniy.github.io/casl/abilities/storage/2017/07/22/storing-abilities.html)


    if (!context.params.ability) context.params.ability = await defineAbilityForContext(context);
    return context;
  };
};