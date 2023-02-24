"use strict";

/**
 * Web API utilities and helpers.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/utils
 */

const crypto = require('crypto');
const math = require('./math');
const isProd = process.env.NODE_ENV === 'production';
const isDev = !isProd;
const MembershipRole = {
  ADMIN: 'admin',
  CURATOR: 'curator',
  MEMBER: 'member'
};
const UserRole = {
  MANAGER: 'manager',
  SYS_ADMIN: 'sys-admin',
  USER: 'user'
};
const Visibility = {
  RESTRICTED: 0,
  METADATA: 1,
  GRAPH: 2,
  DOWNLOAD: 3
};

/**
 * Simple, promise-based hash generator.
 */
function asyncHashDigest(data, algorithm = 'sha1', encoding = 'hex') {
  return new Promise(resolve => {
    setImmediate(() => {
      resolve(crypto.createHash(algorithm).update(data).digest(encoding));
    });
  });
}

/**
 * Returns a random value for id generation.
 */
function idRandom() {
  return Math.floor(Math.random() * 10000);
}

/**
 * Returns annotation helpers for 'compact' JSON timeseries data.
 */
function annotHelpers({
  actions,
  annotationIds
}) {
  let code;
  let q;
  if (actions && actions.evaluate) {
    try {
      code = math.compile(actions.evaluate);
    } catch (_) {}
  }
  if (annotationIds) {
    q = {
      annotation_ids: annotationIds
    };
  }
  if (actions && actions.flag) {
    if (!q) q = {};
    q.flag = actions.flag;
  }
  return {
    code,
    q
  };
}

/**
 * Returns time helpers for 'compact' JSON timeseries data.
 */
function timeHelpers({
  savedQuery
}) {
  const {
    local,
    t_int: tInt
  } = savedQuery;
  const shift = (savedQuery.shift | 0) * 1000;
  let lt;
  let t;
  if (local) {
    lt = tInt ? ldt => ldt.getTime() - shift : ldt => new Date(ldt.getTime() - shift).toISOString().substring(0, 23);
    t = tInt ? (ldt, ms) => ldt.getTime() - shift - ms : (ldt, ms) => new Date(ldt.getTime() - shift - ms);
  } else {
    lt = tInt ? (udt, ms) => udt.getTime() - shift + ms : (udt, ms) => new Date(udt.getTime() - shift + ms).toISOString().substring(0, 23);
    t = tInt ? udt => udt.getTime() - shift : udt => new Date(udt.getTime() - shift);
  }
  return {
    lt,
    t
  };
}
module.exports = {
  annotHelpers,
  asyncHashDigest,
  idRandom,
  isDev,
  isProd,
  MembershipRole,
  timeHelpers,
  UserRole,
  Visibility
};