'use strict';

/**
 * Web API utilities and helpers.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/utils
 */

const crypto = require('crypto');

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

exports.asyncHashDigest = asyncHashDigest;