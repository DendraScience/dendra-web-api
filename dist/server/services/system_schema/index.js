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
  const base = select(...args);

  // NOTE: Likely not needed
  // return base(JSON.parse(JSON.stringify(data)))
  return base(data);
};
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
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
    return this.options.names;
  }
  _schemaPath(id) {
    return path.join(this.options.schemaPath, id);
  }
  async _find(params = {}) {
    const {
      query,
      filters
    } = this.filterQuery(params);
    let values = this._names.map(name => ({
      [this.id]: name
    })).filter(this.options.matcher(query));
    if (filters.$sort !== undefined) {
      values.sort(this.options.sorter(filters.$sort));
    }
    if (filters.$skip !== undefined) {
      values = values.slice(filters.$skip);
    }
    if (filters.$limit !== undefined) {
      values = values.slice(0, filters.$limit);
    }
    return values.map(value => _select(value, params));
  }
  async _get(id, params = {}) {
    if (this._names.includes(id)) {
      const {
        query
      } = this.filterQuery(params);
      const data = await readFile(this._schemaPath(id), 'utf8');
      const value = {
        [this.id]: id,
        content: JSON.parse(data)
      };
      if (this.options.matcher(query)(value)) {
        return _select(value, params, this.id);
      }
    }
    throw new errors.NotFound(`No record found for id '${id}'`);
  }
}
module.exports = function (app) {
  app.use('/system/schemas', new Service({
    names: app.get('schemaNames'),
    schemaPath: app.get('schemaPath')
  }));

  // Get the wrapped service object, bind hooks
  app.service('system/schemas').hooks(hooks);
};