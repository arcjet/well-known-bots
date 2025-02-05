/**
 * This file is used for checking and updating the format of the JSON file.
 *
 * You can check the format via `node format.js --check` and regenerate the
 * file with the correct formatting using `node format.js --generate`.
 *
 * The formatting logic uses `JSON.stringify` with 2 spaces, which will keep
 * separating commas on the same line as any closing character. This technique
 * was chosen for simplicty and to align with common default JSON formatters,
 * such as VSCode.
 */

const fs = require("fs");
const path = require("path");

const jsonFilePath = path.join(__dirname, "well-known-bots.json");

const original = fs.readFileSync(jsonFilePath, "utf-8");

const updated = JSON.stringify(JSON.parse(original), null, 2) + '\n';

if (process.argv[2] === "--generate") {
    fs.writeFileSync(jsonFilePath, updated);
    process.exit(0);
}

if (process.argv[2] === "--check") {
    if (updated !== original) {
        console.error("JSON file format is wrong. Run `node format.js --generate` to update.");
        console.error("Format must be 2 spaces, with newlines for objects and arrays, and separating commas on the line with the previous closing character.");
        process.exit(1);
    }

    for (const item of JSON.parse(original)) {
        if (typeof item.id !== "string") {
            console.error("Item is missing required `id` string field:", item);
            process.exit(1);
        }
        if (typeof item.pattern !== "string") {
            console.error("Item is missing required `pattern` string field:", item);
            process.exit(1);
        }
        if (!Array.isArray(item.categories)) {
            console.error("Item is missing required `categories` array field:", item);
            process.exit(1);
        }
        if (item.categories.length < 1) {
            console.error("The `categories` field must contain at least one:", item);
            process.exit(1);
        }
        // TODO: Validate urls are still accessible
        if (typeof item.url !== "undefined" && typeof item.url !== "string") {
            console.error("Item has wrong type specified for `url` string field:", item);
            process.exit(1);
        }
        if (!Array.isArray(item.verification)) {
            console.error("Item is missing required `verification` array field:", item);
            process.exit(1);
        }
        for (const verify of item.verification) {
            if (verify.type === "cidr") {
                if (!Array.isArray(verify.sources)) {
                    console.error("Item cidr validation entry is missing required `sources` array field:", item, verify);
                    process.exit(1);
                }
                for (const source of verify.sources) {
                    if (source.type !== "http-json") {
                        console.error("Cidr source `type` must be a valid type (currently only `http-json` is supported)", item, verify, source);
                        process.exit(1);
                    }

                    if (typeof source.url !== "string") {
                        console.error("Cidr source `url` must be a string", item, verify, source);
                        process.exit(1);
                    }

                    if (typeof source.selector !== "string") {
                        console.error("Cidr source `selector` must be a string", item, verify, source);
                        process.exit(1);
                    }
                }
            } else if (verify.type === "dns") {
                if (!Array.isArray(verify.masks)) {
                    console.error("Item dns validation entry is missing required `masks` array field:", item, verify);
                    process.exit(1);
                }
                for (const mask of verify.masks) {
                    if (typeof mask !== "string") {
                        console.error("Mask was not a string:", item, verify, mask);
                        process.exit(1);
                    }
                }
            } else {
                console.error("Item validation entry is incorrect, only `dns` and `cidr` are supported:", item, verify);
                process.exit(1);
            }
        }
        if (typeof item.aliases !== "undefined") {
            if (!Array.isArray(item.aliases)) {
                console.error("Item has wrong type specified for `aliases` array field:", item);
                process.exit(1);
            }
            for (const alias of item.aliases) {
                if (typeof alias !== "string") {
                    console.error("Alias was not a string:", item, alias);
                    process.exit(1);
                }
            }
        }
        // TODO: Check `addition_date` is defined properly
        // TODO: Check or remove `depends_on` field
        if (typeof item.instances !== "undefined") {
            if (!Array.isArray(item.instances)) {
                console.error("Item has wrong type specified for `instances` array field:", item);
                process.exit(1);
            }
            for (const instance of item.instances) {
                if (typeof instance !== "string") {
                    console.error("Instance was not a string:", item, instance);
                    process.exit(1);
                }
                const re = new RegExp(item.pattern);
                if (!re.test(instance)) {
                    console.error("Invalid instance for pattern:")
                    console.error("  pattern: ", item.pattern);
                    console.error("  instance: ", instance);
                    process.exit(1);
                }
            }
        }
    }
}

