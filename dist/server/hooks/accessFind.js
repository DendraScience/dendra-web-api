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

    if (filters.$limit === 0) {
      context.result = shapeResult();
      return context;
    }
    /*
      Construct aggregation pipeline.
     */


    if (query[service.id]) {
      query[service.id] = service._objectifyId(query[service.id]);
    }

    const pipeline = [{
      $match: query
    }, ...stages];
    if (accessQuery) pipeline.push({
      $match: accessQuery
    });
    const dataPipeline = [];

    if (filters.$select) {
      dataPipeline.push({
        $project: service._getSelect(filters.$select)
      });
    }

    if (filters.$sort) {
      dataPipeline.push(filters.$sort);
    } else {
      dataPipeline.push({
        $sort: {
          _id: 1
        }
      });
    }

    if (filters.$limit) {
      dataPipeline.push({
        $limit: filters.$limit
      });
    }

    if (filters.$skip) {
      dataPipeline.push({
        $skip: filters.$skip
      });
    }

    pipeline.push({
      $facet: {
        data: dataPipeline,
        total: [{
          $count: 'count'
        }]
      }
    });
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