const { readFileSync } = require("node:fs");
const { basename, resolve } = require("node:path");
const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const schema = require("../../well-known-bots.schema.json");
const dataPath = process.argv[2] ?? resolve(__dirname, "../../well-known-bots.json");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (validate(data)) {
  console.log(`${basename(dataPath)} valid`);
} else {
  console.error(ajv.errorsText(validate.errors, { separator: "\n" }));
  process.exitCode = 1;
}
