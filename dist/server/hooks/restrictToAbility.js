"use strict";

const errors = require('@feathersjs/errors');

const {
  permittedFieldsOf
} = require('@casl/ability/extra');

const _ = require('lodash');

const {
  TYPE_KEY
} = require('../lib/ability');

module.exports = () => {
  return async context => {
    if (context.type !== 'before') {
      throw new Error("The 'restrictToAbility' hook should only be used as a 'before' hook.");
    }

    if (!context.params.provider) return context;
    const {
      method: action,
      params,
      path: serviceName,
      service
    } = context;
    const {
      ability
    } = params;

    if (!ability) {
      throw new Error("The 'restrictToAbility' hook requires params.ability.");
    }

    if (context.data && action !== 'patch') {
      context.data[TYPE_KEY] = serviceName;

      if (ability.cannot(action, context.data)) {
        throw new errors.Forbidden(`You are not allowed to ${action} ${serviceName} using the data`);
      }
    }

    let before;
    console.log('>>> HERE');

    if (context.id) {
      before = await service.get(context.id, Object.assign({}, params, {
        provider: null
      }));
      before[TYPE_KEY] = serviceName;

      if (ability.cannot(action, before)) {
        throw new errors.Forbidden(`You are not allowed to ${action} the existing ${serviceName}`);
      }
    }

    if (action === 'patch') {
      if (!before) {
        throw new errors.Forbidden(`You are not allowed to ${action} without matching ${serviceName}`);
      }

      const data = context.data || {};
      const setFields = Object.keys(data.$set || {}).map(f => '$set.' + f);
      const unsetFields = Object.keys(data.$unset || {}).map(f => '$unset.' + f);
      const allFields = Array.prototype.concat(setFields, unsetFields);
      const allowedFields = permittedFieldsOf(ability, 'assign', serviceName, {
        fieldsFrom: rule => rule.fields || allFields
      });

      const allowedData = _.pick(data, allowedFields);

      const patchedData = _.clone(before);

      console.log('>>> PATCH allowedData.0', allowedData);
      console.log('>>> PATCH patchedData.1', patchedData);
      if (allowedData.$set) _.forEach(allowedData.$set, (v, k) => _.set(patchedData, k, v));
      if (allowedData.$unset) _.forEach(allowedData.$unset, (v, k) => _.unset(patchedData, k));
      console.log('>>> PATCH patchedData.2', patchedData);

      if (ability.cannot(action, patchedData)) {
        throw new errors.Forbidden(`You are not allowed to ${action} ${serviceName} using the data`);
      }

      context.data = {};
      if (allowedData.$set) context.data.$set = allowedData.$set;
      if (allowedData.$unset) context.data.$unset = allowedData.$unset;
      console.log('>>> PATCH context.data', context.data);
    }

    params.before = before;
    return context;
  };
};