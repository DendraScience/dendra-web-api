"use strict";

/**
 * Web API utilities and helpers.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/utils
 */
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';
const isDev = !isProd;
const UserRole = {
  SYS_ADMIN: 'sys-admin',
  USER: 'user'
};
const Visibility = {
  RESTRICTED: 0,
  METADATA: 1,
  GRAPH: 2,
  DOWNLOAD: 3
  /**
   * Simple, promise-based hash generator.
   */

};

function asyncHashDigest(data, algorithm = 'sha1', encoding = 'hex') {
  return new Promise(resolve => {
    setImmediate(() => {
      resolve(crypto.createHash(algorithm).update(data).digest(encoding));
    });
  });
}
/**
 * Returns a key and value formatter for 'compact' JSON timeseries data.
 */


function tKeyVal({
  local,
  t_int: tInt,
  t_local: tLocal
}) {
  let key;
  let val;

  if (tLocal) {
    key = 'lt';

    if (local) {
      val = tInt ? ldt => ldt.getTime() : ldt => ldt;
    } else {
      val = tInt ? (udt, ms) => udt.getTime() + ms : (udt, ms) => new Date(udt.getTime() + ms);
    }
  } else {
    key = 't';

    if (local) {
      val = tInt ? (ldt, ms) => ldt.getTime() - ms : (ldt, ms) => new Date(ldt.getTime() - ms);
    } else {
      val = tInt ? udt => udt.getTime() : udt => udt;
    }
  }

  return {
    key,
    val
  };
}

module.exports = {
  asyncHashDigest,
  isDev,
  isProd,
  tKeyVal,
  UserRole,
  Visibility
};