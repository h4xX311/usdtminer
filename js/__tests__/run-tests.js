const assert = require('node:assert/strict');
const { parseUnitsDecimal, formatUnitsFromBase } = require('../eth-utils.js');

assert.equal(parseUnitsDecimal('1.5', 18), '1500000000000000000');
assert.equal(parseUnitsDecimal('0.000000000000000001', 18), '1');
assert.equal(parseUnitsDecimal('0', 18), '0');
assert.equal(formatUnitsFromBase('1500000000000000000', 18), '1.5');
assert.equal(formatUnitsFromBase('1000000000000000000', 18), '1');
assert.equal(formatUnitsFromBase('1230000000000000000', 18), '1.23');

console.log('All tests passed.');
