"use strict";

const auth = require('@feathersjs/authentication');

const errors = require('@feathersjs/errors');

const {
  disallow,
  iff
} = require('feathers-hooks-common');

const setAbility = require('../../../hooks/setAbility');

exports.before = {
  // all: [],
  find: disallow(),
  get: [iff(context => context.params.headers && context.params.headers.authorization, auth.hooks.authenticate('jwt')), setAbility(), context => {
    if (context.id !== 'current') throw new errors.NotFound(`No record found for id '${context.id}'`);
    context.result = {
      _id: 'current',
      rules: context.params.ability.rules
    };
  }],
  create: disallow(),
  update: disallow(),
  patch: disallow(),
  remove: disallow()
};
exports.after = {// all: [],
  // find: [],
  // get: [],
  // create: [],
  // update: [],
  // patch: [],
  // remove: []
};