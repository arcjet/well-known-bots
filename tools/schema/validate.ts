import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "../../well-known-bots.schema.json" with { type: "json" };

const dataPath = process.argv[2] ?? resolve(import.meta.dirname, "../../well-known-bots.json");
const data: unknown = JSON.parse(readFileSync(dataPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

if (validate(data)) {
  console.log(`${basename(dataPath)} valid`);
} else {
  console.error(ajv.errorsText(validate.errors, { separator: "\n" }));
  process.exitCode = 1;
}
