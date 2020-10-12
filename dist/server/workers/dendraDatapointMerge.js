"use strict";

const {
  ThreadWorker
} = require('poolifier');

const {
  annotHelpers
} = require('../lib/utils');

function dendraDatapointMerge({
  params,
  result
}) {
  const newResult = [];
  if (!result.length) return newResult;
  const daEmpty = new Array(result.length).fill({});
  const vaEmpty = new Array(result.length).fill(null);
  const map = new Map();

  for (let i = 0; i < result.length; i++) {
    const res = result[i];
    if (!(res && res.data)) continue;
    const {
      data
    } = res;

    for (let j = 0; j < data.length; j++) {
      const item = data[j];
      const key = item.lt;
      let newItem = map.get(key);

      if (!newItem) {
        newItem = {
          lt: item.lt
        };
        if (item.o !== undefined) newItem.o = item.o;
        if (item.t !== undefined) newItem.t = item.t;
        map.set(key, newItem);
      }

      if (item.d !== undefined) {
        if (!newItem.da) newItem.da = daEmpty.slice();
        newItem.da[i] = item.d;
      }

      if (item.v !== undefined) {
        if (!newItem.va) newItem.va = vaEmpty.slice();
        newItem.va[i] = item.v;
      }
    }
  }

  const query = params.query || {};
  const {
    $sort: sort
  } = query;
  const {
    code,
    q
  } = annotHelpers(params);

  const compareNumbers = (a, b) => a - b;

  let keys = [...map.keys()];
  keys = typeof keys[0] === 'number' ? keys.sort(compareNumbers) : keys.sort();

  if (sort && sort.time === -1) {
    // DESC
    for (let i = keys.length - 1; i > -1; i--) {
      const item = map.get(keys[i]);

      if (code) {
        try {
          code.evaluate(item);
        } catch (_) {}
      }

      if (q) item.q = q;
      newResult.push(item);
    }
  } else {
    // ASC
    for (let i = 0; i < keys.length; i++) {
      const item = map.get(keys[i]);

      if (code) {
        try {
          code.evaluate(item);
        } catch (_) {}
      }

      if (q) item.q = q;
      newResult.push(item);
    }
  }

  return newResult;
}

module.exports = new ThreadWorker(dendraDatapointMerge, {
  maxInactiveTime: 60000
});