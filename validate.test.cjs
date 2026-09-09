const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { test } = require("node:test");

function fixture(t, changes = {}) {
  const directory = mkdtempSync(join(tmpdir(), "bot-validator-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const script = join(directory, "validate.ts");
  const file = join(directory, "well-known-bots.json");
  copyFileSync(join(__dirname, "validate.ts"), script);
  const bots = [{
    id: "test-bot",
    categories: ["monitor"],
    pattern: { accepted: ["TestBot"], forbidden: ["Preview"] },
    verification: [],
    instances: { accepted: ["TestBot/1"], rejected: ["TestBot Preview"] },
    ...changes,
  }];
  writeFileSync(file, JSON.stringify(bots, null, 2) + "\n");
  return {
    file,
    bots,
    run: (mode) => spawnSync(process.execPath, [script, mode], {
      cwd: tmpdir(),
      encoding: "utf8",
    }),
  };
}

test("check mode validates patterns without modifying the data", (t) => {
  const data = fixture(t);
  const original = readFileSync(data.file, "utf8");
  const result = data.run("--check");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(data.file, "utf8"), original);
});

test("check mode rejects pattern and verification errors", (t) => {
  for (const changes of [
    { instances: { accepted: ["OtherBot"], rejected: [] } },
    { instances: { accepted: [], rejected: ["TestBot/1"] } },
    { pattern: { accepted: ["["], forbidden: [] } },
    { verification: [null] },
    { verification: [{ type: "cidr", sources: [null] }] },
  ]) {
    const result = fixture(t, changes).run("--check");
    assert.equal(result.status, 1, result.stderr);
    assert.notEqual(result.stderr, "");
  }
});

test("generate mode normalizes formatting and preserves bot definitions", (t) => {
  const data = fixture(t);
  writeFileSync(data.file, JSON.stringify(data.bots));
  assert.equal(data.run("--check").status, 1);
  const result = data.run("--generate");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(data.file, "utf8"), JSON.stringify(data.bots, null, 2) + "\n");
  assert.equal(data.run("--check").status, 0);
});
