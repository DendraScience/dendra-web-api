"use strict";

const errors = require('@feathersjs/errors');

const {
  _
} = require('@feathersjs/commons');

const {
  sorter,
  select,
  AdapterService
} = require('@feathersjs/adapter-commons');

const sift = require('sift').default;

const _select = (data, ...args) => {
  const base = select(...args); // NOTE: Likely not needed
  // return base(JSON.parse(JSON.stringify(data)))

  return base(data);
};

const moment = require('moment-timezone');

const hooks = require('./hooks');

class Service extends AdapterService {
  constructor(options = {}) {
    super(_.extend({
      id: '_id',
      matcher: sift,
      sorter
    }, options));
  }

  get _names() {
    return moment.tz.names();
  }

  async _find(params = {}) {
    const {
      query,
      filters,
      paginate
    } = this.filterQuery(params);

    let values = this._names.map(name => ({
      [this.id]: name
    })).filter(this.options.matcher(query));

    const total = values.length;

    if (filters.$sort !== undefined) {
      values.sort(this.options.sorter(filters.$sort));
    }

    if (filters.$skip !== undefined) {
      values = values.slice(filters.$skip);
    }

    if (filters.$limit !== undefined) {
      values = values.slice(0, filters.$limit);
    }

    const result = {
      total,
      limit: filters.$limit,
      skip: filters.$skip || 0,
      data: values.map(value => _select(value, params))
    };

    if (!(paginate && paginate.default)) {
      return result.data;
    }

    return result;
  }

  async _get(id, params = {}) {
    const zone = moment.tz.zone(id);

    if (zone) {
      const {
        query
      } = this.filterQuery(params);
      const value = {
        [this.id]: id,
        zone
      };

      if (this.options.matcher(query)(value)) {
        return _select(value, params, this.id);
      }
    }

    throw new errors.NotFound(`No record found for id '${id}'`);
  }

}

module.exports = function (app) {
  app.use('/system/timezones', new Service()); // Get the wrapped service object, bind hooks

  const timezoneService = app.service('/system/timezones');
  timezoneService.hooks(hooks);
};