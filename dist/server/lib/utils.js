"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDev = exports.isProd = void 0;

/**
 * Web API utilities and helpers.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/utils
 */
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';
exports.isProd = isProd;
const isDev = !isProd;
/**
 * Simple, promise-based hash generator.
 */

exports.isDev = isDev;

function asyncHashDigest(data, algorithm = 'sha1', encoding = 'hex') {
  return new Promise(resolve => {
    setImmediate(() => {
      resolve(crypto.createHash(algorithm).update(data).digest(encoding));
    });
  });
}

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
  tKeyVal
};