const assert = require("node:assert/strict");
const { isIP } = require("node:net");
const { test } = require("node:test");
const schema = require("./well-known-bots.schema.json");

const patterns = {
  4: new RegExp(schema.$defs.ipv4Cidr.pattern, "u"),
  6: new RegExp(schema.$defs.ipv6Cidr.pattern, "u"),
};

// Check the schema's CIDR patterns against Node's independent address parser.
function checkCidr(value, expected) {
  const parts = value.split("/");
  const family = isIP(parts[0]);
  const valid = parts.length === 2 && family !== 0 &&
    !parts[0].includes("%") && /^(0|[1-9][0-9]*)(?![\s\S])/u.test(parts[1]) &&
    Number(parts[1]) <= (family === 4 ? 32 : 128);
  assert.equal(valid, expected, `Node parser: ${JSON.stringify(value)}`);
  assert.equal(
    patterns[4].test(value) || patterns[6].test(value),
    expected,
    `Schema: ${JSON.stringify(value)}`,
  );
}

test("CIDRs accept valid addresses and prefix boundaries", () => {
  for (const address of ["0.0.0.0", "192.0.2.1", "255.255.255.255"]) {
    for (let prefix = 0; prefix <= 32; prefix++) {
      checkCidr(`${address}/${prefix}`, true);
    }
  }
  for (const address of [
    "::", "::1", "2001:DB8::", "2001:db8:1:2:3:4:5:6",
    "::ffff:192.0.2.1", "1:2:3:4:5:6:192.0.2.1",
  ]) {
    for (let prefix = 0; prefix <= 128; prefix++) {
      checkCidr(`${address}/${prefix}`, true);
    }
  }
});

test("IPv6 compression accepts every position and rejects too many groups", () => {
  for (const embedded of [false, true]) {
    const groups = embedded ? 6 : 8;
    for (let left = 0; left <= groups + 1; left++) {
      for (let right = 0; right <= groups + 1; right++) {
        const before = Array(left).fill("abcd").join(":");
        const after = [
          ...Array(right).fill("1234"),
          ...(embedded ? ["192.0.2.1"] : []),
        ].join(":");
        checkCidr(`${before}::${after}/64`, left + right < groups);
      }
    }
  }
});

test("CIDRs reject malformed addresses and prefixes", () => {
  for (const value of [
    "deadbeef/64", "::::/128", "1.2.3.4/64",
    "192.0.2.1/33", "192.0.2.256/24", "192.00.2.1/24",
    "2001:db8::/129", "2001:db8::/-1", "2001:db8::/01",
    "2001:db8::/1.5", "2001:db8::/+64", "2001:db8::/",
    "2001:db8::/64/64", "1:2:3:4:5:6:7/64", "1:2:3:4:5:6:7:8:9/64",
    "2001::db8::1/64", "2001:db8:12345::/64", "2001:db8:xyz::/64",
    "::ffff:256.1.2.3/64", "::ffff:192.00.2.1/64", "fe80::1%eth0/64",
    " 2001:db8::/64", "2001:db8::/64 ", "2001:db8::/64\n",
    "192.0.2.1/24\n", "2001:db8::", "192.0.2.1",
  ]) {
    checkCidr(value, false);
  }
});
