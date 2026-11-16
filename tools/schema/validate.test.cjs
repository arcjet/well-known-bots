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

test("accepts a SAIL source that names a service", (t) => {
  const result = validateFixture(t, {
    verification: [{
      type: "cidr",
      sources: [{
        type: "http-sail",
        url: "https://claude.com/.well-known/sail",
        service: "Claude-Agent",
      }],
    }],
  });
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a SAIL source without a service", (t) => {
  for (const source of [
    { type: "http-sail", url: "https://claude.com/.well-known/sail" },
    { type: "http-sail", url: "https://claude.com/.well-known/sail", service: "" },
    { type: "http-sail", url: "https://claude.com/.well-known/sail", selector: "Claude-Agent" },
  ]) {
    const result = validateFixture(t, {
      verification: [{ type: "cidr", sources: [source] }],
    });
    assert.equal(result.status, 1, `${JSON.stringify(source)}: ${result.stderr}`);
  }
});

test("accepts a registrable domain operator", (t) => {
  for (const operator of ["openai.com", "perplexity.ai", "sbintuitions.co.jp", "9bot.com.br", "xn--p1ai.xn--p1ai"]) {
    const result = validateFixture(t, { operator });
    assert.equal(result.status, 0, `${operator}: ${result.stderr}`);
  }
});

test("rejects malformed operators", (t) => {
  for (const operator of [
    "", "openai", "OpenAI.com", "https://openai.com", "openai.com/", "openai.com/bot",
    "openai.com:443", "openai.com.", ".openai.com", "www.openai.com", "open_ai.com",
    "-openai.com", "openai-.com", "openai.123", " openai.com", "openai.com\n",
    "user@openai.com", `${"a".repeat(64)}.com`, `${"a.".repeat(126)}com`, 1, null, ["openai.com"],
  ]) {
    const result = validateFixture(t, { operator });
    assert.equal(result.status, 1, `${JSON.stringify(operator)}: ${result.stderr}`);
    assert.match(result.stderr, /operator/);
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

test("accepts a botnet with no patterns, instances or verification", (t) => {
  const result = validateFixture(t, {
    categories: ["botnet"],
    pattern: { accepted: [], forbidden: [] },
    verification: [],
  });
  assert.equal(result.status, 0, result.stderr);
});

test("rejects every other botnet shape", (t) => {
  for (const changes of [
    // Signer verification does not make a botnet a signature-only bot.
    {
      verification: [{
        type: "web-bot-auth",
        directory: "https://chatgpt.com/.well-known/http-message-signatures-directory",
      }],
    },
    { pattern: { accepted: ["TestBot"], forbidden: [] } },
    { pattern: { accepted: [], forbidden: ["TestBot"] } },
    { instances: { accepted: [], rejected: [] } },
  ]) {
    const result = validateFixture(t, {
      categories: ["botnet"],
      pattern: { accepted: [], forbidden: [] },
      verification: [],
      ...changes,
    });
    assert.equal(result.status, 1, `${JSON.stringify(changes)}: ${result.stderr}`);
  }
});

test("rejects User-Agent instances for signature-only bots", (t) => {
  for (const instances of [
    { accepted: ["AnyBot/1"], rejected: [] },
    { accepted: [], rejected: [] },
  ]) {
    const result = validateFixture(t, {
      pattern: { accepted: [], forbidden: [] },
      verification: [{
        type: "web-bot-auth",
        directory: "https://chatgpt.com/.well-known/http-message-signatures-directory",
      }],
      instances,
    });
    assert.equal(result.status, 1, result.stderr);
  }
});

test("rejects malformed Web Bot Auth directories", (t) => {
  for (const directory of [
    "http://chatgpt.com/.well-known/http-message-signatures-directory",
    "https://user@chatgpt.com/.well-known/http-message-signatures-directory",
    "https://chatgpt.com:443/.well-known/http-message-signatures-directory",
    "https://chatgpt.com:8443/.well-known/http-message-signatures-directory",
    "https://127.0.0.1/.well-known/http-message-signatures-directory",
    "https://0177.0.0.1/.well-known/http-message-signatures-directory",
    "https://2130706433/.well-known/http-message-signatures-directory",
    "https://[::1]/.well-known/http-message-signatures-directory",
    "https://localhost/.well-known/http-message-signatures-directory",
    "https://chatgpt.com./.well-known/http-message-signatures-directory",
    "https://ChatGPT.com/.well-known/http-message-signatures-directory",
    "https://chatgpt.123/.well-known/http-message-signatures-directory",
    "https://chatgpt.com/.well-known/http-message-signatures-directory?key=1",
    "https://chatgpt.com/other",
  ]) {
    const result = validateFixture(t, {
      verification: [{ type: "web-bot-auth", directory }],
    });
    assert.equal(result.status, 1, `${directory}: ${result.stderr}`);
  }
});

test("accepts a signature-only bot with a Poppy client_id", (t) => {
  const result = validateFixture(t, {
    pattern: { accepted: [], forbidden: [] },
    verification: [{ type: "poppy", client_id: "https://muse.ai/poppy/agent.json" }],
  });
  assert.equal(result.status, 0, result.stderr);
});

test("rejects malformed Poppy client_ids", (t) => {
  for (const verify of [
    { type: "poppy", client_id: "http://muse.ai/poppy/agent.json" },
    { type: "poppy", client_id: "https://muse.ai/" },
    { type: "poppy", client_id: "https://muse.ai:8443/poppy/agent.json" },
    { type: "poppy", client_id: "https://muse.ai/poppy/agent.json?v=1" },
    { type: "poppy", client_id: "https://muse.ai/poppy/../agent.json" },
    { type: "poppy", client_id: "https://muse.ai/poppy/./agent.json" },
    { type: "poppy", client_id: "https://muse.ai/.." },
    { type: "poppy", client_id: "https://muse.ai/." },
    { type: "poppy", client_id: "https://muse.ai/poppy/agent.json", extra: true },
    { type: "poppy" },
  ]) {
    const result = validateFixture(t, { verification: [verify] });
    assert.equal(result.status, 1, `${JSON.stringify(verify)}: ${result.stderr}`);
  }
});
