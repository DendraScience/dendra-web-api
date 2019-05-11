"use strict";

const {
  toMongoQuery
} = require('@casl/mongoose');

const _ = require('lodash');
/**
 * Performs a service find method restricted by access ability rules.
 *
 * SEE:
 * https://stalniy.github.io/casl/abilities/database/integration/2017/07/22/database-integration.html
 * https://github.com/feathersjs-ecosystem/feathers-mongodb/blob/master/lib/index.js
 * https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/
 */


module.exports = (stages = []) => {
  return async context => {
    if (context.type !== 'before') {
      throw new Error("The 'accessFind' hook should only be used as a 'before' hook.");
    }

    if (!context.params.provider) return context;
    const {
      params,
      service,
      path: serviceName
    } = context;
    const {
      ability
    } = params;

    if (!ability) {
      throw new Error("The 'accessFind' hook requires params.ability.");
    }

    if (!params.query) params.query = {};
    const accessQuery = toMongoQuery(ability, serviceName, 'access');
    if (accessQuery === null) params.query.$limit = 0;
    const {
      filters,
      query,
      paginate
    } = service.filterQuery(params);

    const shapeResult = r => {
      if (paginate && paginate.default) {
        return {
          total: _.get(r, '[0].total[0].count'),
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data: _.get(r, '[0].data', [])
        };
      }

      return _.get(r, '[0].data', []);
    };
    /*
      Construct aggregation pipeline.
     */


    if (query[service.id]) {
      query[service.id] = service._objectifyId(query[service.id]);
    }

    const pipeline = [{
      $match: query
    }, ...stages];
    if (accessQuery && Object.keys(accessQuery).length) pipeline.push({
      $match: accessQuery
    });
    const total = [{
      $count: 'count'
    }];

    if (filters.$limit === 0) {
      pipeline.push({
        $facet: {
          total
        }
      });
    } else {
      const data = [];

      if (filters.$select) {
        data.push({
          $project: service._getSelect(filters.$select)
        });
      }

      if (filters.$sort) {
        data.push({
          $sort: filters.$sort
        });
      } else {
        data.push({
          $sort: {
            _id: 1
          }
        });
      }

      if (filters.$skip) {
        data.push({
          $skip: filters.$skip
        });
      }

      if (filters.$limit) {
        data.push({
          $limit: filters.$limit
        });
      }

      pipeline.push({
        $facet: {
          data,
          total
        }
      });
    }

    const options = {
      allowDiskUse: true
    };
    if (params.collation) options.collation = params.collation;
    if (params.hint) options.hint = params.hint;
    const result = await service.Model.aggregate(pipeline, options).toArray();
    context.result = shapeResult(result);
    return context;
  };
};