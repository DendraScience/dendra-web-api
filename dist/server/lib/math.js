"use strict";

/**
 * Math.js exported with custom bundling.
 * SEE: http://mathjs.org/docs/custom_bundling.html
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module lib/utils
 */
const core = require('mathjs/core');

const math = core.create();
math.import(require('mathjs/lib/type/complex'));
math.import(require('mathjs/lib/type/unit'));
math.import(require('mathjs/lib/function/unit'));
math.import(require('mathjs/lib/function/arithmetic/round')); // HACK: Prefixes are not turned on for 'bar'; oh freakin' why not - improvise with a custom unit
// NOTE: The createUnit API into math.js is weird and confusing: http://mathjs.org/docs/datatypes/units.html

math.createUnit('mbar', '0.0145038 psi');
module.exports = math;