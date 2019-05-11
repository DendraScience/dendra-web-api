"use strict";

const {
  filterQuery
} = require('@feathersjs/adapter-commons');

const {
  Interval
} = require('@dendra-science/utils');

const hooks = require('./hooks'); // Reasonable min and max dates to perform low-level querying
// NOTE: Didn't use min/max integer since db date conversion could choke
// NOTE: Revised to be within InfluxDB default dates


const MIN_TIME = Date.UTC(1800, 1, 2);
const MAX_TIME = Date.UTC(2200, 1, 2);
/**
 * High-level service that provides a standard facade to retrieve datapoints.
 *
 * This service forwards 'find' requests to one or more low-level services based on
 * config instances listed under datapoints_config_built or datapoints_config.
 */

class Service {
  constructor(options) {
    this.options = Object.assign({
      paginate: {}
    }, options);
  }

  setup(app) {
    this.app = app;
    this.connections = app.get('connections');
  }

  async find(params) {
    const {
      query,
      filters
    } = filterQuery(params.query || {}, {
      paginate: this.options.paginate
    });
    const {
      datastream
    } = params;
    /*
      Efficiently merge config instances in a linear traversal by evaluating each
      instance's date/time interval [begins_at, ends_before).
       Steps:
      1. Filter instances based on required fields, enabled, etc.
      2. Convert begins_at/ends_before to time; deal with nulls
      3. Sort instances by beginsAt
      4. Exclude, merge or adjust intervals
      5. Do a final reorder based on $sort.time
     */

    const stack = [];
    let config = [];

    if (typeof datastream === 'object') {
      if (Array.isArray(datastream.datapoints_config_built)) {
        config = datastream.datapoints_config_built;
      } else if (Array.isArray(datastream.datapoints_config)) {
        config = datastream.datapoints_config;
      }
    }

    config.filter(inst => {
      return typeof inst.path === 'string' && !(inst.actions && inst.actions.exclude === true);
    }).map(inst => {
      return {
        connection: typeof inst.connection === 'string' && this.connections[inst.connection] ? this.connections[inst.connection] : this,
        beginsAt: inst.begins_at instanceof Date ? inst.begins_at.getTime() : MIN_TIME,
        endsBefore: inst.ends_before instanceof Date ? inst.ends_before.getTime() : MAX_TIME,
        params: inst.params,
        path: inst.path
      };
    }).sort((a, b) => {
      if (a.beginsAt < b.beginsAt) return -1;
      if (a.beginsAt > b.beginsAt) return 1;
      return 0;
    }).forEach(inst => {
      if (inst.endsBefore <= inst.beginsAt) {// Exclude: inverted interval
      } else if (stack.length === 0) {
        stack.push(inst); // Init stack
      } else {
        const top = stack[stack.length - 1];

        if (inst.beginsAt >= top.endsBefore) {
          stack.push(inst);
        } else if (inst.endsBefore <= top.endsBefore) {// Exclude: instance interval is within top interval
        } else if (inst.beginsAt === top.beginsAt) {
          stack.pop();
          stack.push(inst);
        } else {
          top.endsBefore = inst.beginsAt;
          stack.push(inst);
        }
      }
    }); // Points can only be sorted by 'time' (default DESC)

    filters.$sort = {
      time: typeof filters.$sort === 'object' && typeof filters.$sort.time !== 'undefined' ? filters.$sort.time : -1
    };
    config = filters.$sort.time === -1 ? stack.reverse() : stack;
    /*
      Construct a query interval based on 'time' query field.
     */

    const queryInterval = new Interval(MIN_TIME, MAX_TIME, false, true);

    if (typeof query.time === 'object') {
      const queryTime = query.time;

      if (queryTime.$gt instanceof Date) {
        queryInterval.start = queryTime.$gt.getTime();
        queryInterval.leftOpen = true;
      } else if (queryTime.$gte instanceof Date) {
        queryInterval.start = queryTime.$gte.getTime();
        queryInterval.leftOpen = false; // Closed interval
      }

      if (queryTime.$lt instanceof Date) {
        queryInterval.end = queryTime.$lt.getTime();
        queryInterval.rightOpen = true;
      } else if (queryTime.$lte instanceof Date) {
        queryInterval.end = queryTime.$lte.getTime();
        queryInterval.rightOpen = false; // Closed interval
      }
    }
    /*
      Iterate over config instances and query low-level services where the query
      interval intersects the instance's interval.
     */


    const result = {
      limit: filters.$limit,
      data: []
    };

    for (let inst of config) {
      // Intersect intervals; skip querying if empty
      const interval = queryInterval.intersect(new Interval(inst.beginsAt, inst.endsBefore, false, true));
      if (interval.empty) continue;
      /*
        Construct a low-level query using the clamped interval and config instance
        fields. Do this only if we haven't reached our limit.
       */

      if (result.data.length >= filters.$limit) break;
      const p = Object.assign({}, inst.params, {
        provider: null
      });
      const q = p.query = Object.assign({}, p.query);
      q.$limit = filters.$limit - result.data.length;
      q.$sort = filters.$sort;
      q.compact = true;
      if (query.lat) q.lat = query.lat;
      if (query.lon) q.lon = query.lon;
      if (query.lng) q.lng = query.lng;
      if (query.t_int) q.t_int = query.t_int;
      if (query.t_local) q.t_local = query.t_local;
      q.time = {};
      q.time[interval.leftOpen ? '$gt' : '$gte'] = new Date(interval.start);
      q.time[interval.rightOpen ? '$lt' : '$lte'] = new Date(interval.end); // Call the low-level service!

      const res = await inst.connection.app.service(inst.path).find(p); // Combine the results
      // TODO: Not the most efficient, optimize somehow?

      if (Array.isArray(res)) result.data = result.data.concat(res);else if (Array.isArray(res.data)) result.data = result.data.concat(res.data);
    }

    return result;
  }

}

module.exports = function (app) {
  const services = app.get('services');
  if (!services.datapoint) return;
  app.use('/datapoints', new Service({
    paginate: services.datapoint.paginate
  })); // Get the wrapped service object, bind hooks

  app.service('datapoints').hooks(hooks);
};