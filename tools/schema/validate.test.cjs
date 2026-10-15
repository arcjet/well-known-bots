const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { test } = require("node:test");

const script = join(__dirname, "validate.ts");

function validateFixture(t, changes) {
  const directory = mkdtempSync(join(tmpdir(), "bot-schema-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "bots.json");
  const bot = {
    id: "test-bot",
    categories: ["monitor"],
    pattern: { accepted: ["TestBot"], forbidden: [] },
    verification: [],
    ...changes,
  };
  writeFileSync(file, JSON.stringify([bot]));
  return spawnSync(process.execPath, [script, file], { encoding: "utf8" });
}

test("validates the repository data independently of the working directory", () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: tmpdir(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /well-known-bots\.json valid/);
});

test("rejects structural schema violations", (t) => {
  const result = validateFixture(t, { categories: ["not-a-category"] });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /categories/);
});

test("enforces the registered IP address formats", (t) => {
  const result = validateFixture(t, {
    verification: [{ type: "ip", ips: ["999.999.999.999"] }],
  });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /verification/);
});

test("rejects the malformed CIDRs from the review through the full schema", (t) => {
  for (const ip of ["deadbeef/64", "::::/128", "1.2.3.4/64"]) {
    const result = validateFixture(t, {
      verification: [{ type: "ip", ips: [ip] }],
    });
    assert.equal(result.status, 1, `${ip}: ${result.stderr}`);
    assert.match(result.stderr, /verification/);
  }
});

test("accepts a signature-only bot with a canonical Web Bot Auth directory", (t) => {
  const result = validateFixture(t, {
    pattern: { accepted: [], forbidden: [] },
    verification: [{
      type: "web-bot-auth",
      directory: "https://chatgpt.com/.well-known/http-message-signatures-directory",
    }],
  });
  assert.equal(result.status, 0, result.stderr);
});

test("requires Web Bot Auth when the User-Agent pattern is empty", (t) => {
  for (const changes of [
    { pattern: { accepted: [], forbidden: [] } },
    {
      pattern: { accepted: [], forbidden: ["TestBot"] },
      verification: [{
        type: "web-bot-auth",
        directory: "https://chatgpt.com/.well-known/http-message-signatures-directory",
      }],
    },
  ]) {
    const result = validateFixture(t, changes);
    assert.equal(result.status, 1, result.stderr);
  }
});

test("rejects malformed Web Bot Auth directories", (t) => {
  for (const directory of [
    "http://chatgpt.com/.well-known/http-message-signatures-directory",
    "https://user@chatgpt.com/.well-known/http-message-signatures-directory",
    "https://chatgpt.com/.well-known/http-message-signatures-directory?key=1",
    "https://chatgpt.com/other",
  ]) {
    const result = validateFixture(t, {
      verification: [{ type: "web-bot-auth", directory }],
    });
    assert.equal(result.status, 1, `${directory}: ${result.stderr}`);
  }
});
