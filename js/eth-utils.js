// Utility functions for unit conversions without ethers.js dependency (suitable for unit tests)
// Uses BigInt internally and returns strings to avoid floating point issues.

function normalizeInput(value) {
  if (value === null || value === undefined) return '0';
  return String(value).trim().replace(/,/g, '.');
}

function parseUnitsDecimal(value, decimals) {
  const v = normalizeInput(value);
  if (v === '' || v === '0') return '0';
  if (!/^\d+(?:\.\d+)?$/.test(v)) throw new Error('Invalid decimal number');
  const parts = v.split('.');
  const whole = parts[0];
  const fraction = parts[1] || '';
  if (fraction.length > decimals) {
    // Trim or round? We will trim (floor)
    const trimmed = fraction.slice(0, decimals);
    const combined = BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(trimmed.padEnd(decimals, '0'));
    return combined.toString();
  }
  const padded = (whole === '' ? '0' : whole) + fraction.padEnd(decimals, '0');
  return BigInt(padded).toString();
}

function formatUnitsFromBase(baseUnitsStr, decimals) {
  const s = String(baseUnitsStr || '0');
  const neg = s.startsWith('-');
  const num = neg ? s.slice(1) : s;
  const bn = BigInt(num || '0');
  const base = BigInt(10) ** BigInt(decimals);
  const whole = bn / base;
  const fraction = bn % base;
  if (fraction === BigInt(0)) return (neg ? '-' : '') + whole.toString();
  let fracStr = fraction.toString().padStart(decimals, '0');
  // remove trailing zeros
  fracStr = fracStr.replace(/0+$/, '');
  return (neg ? '-' : '') + whole.toString() + '.' + fracStr;
}

module.exports = { parseUnitsDecimal, formatUnitsFromBase };
