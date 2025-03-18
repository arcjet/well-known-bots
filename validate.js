/**
 * This file is used for checking and updating the format of the JSON file.
 *
 * You can check the format via `node format.js --check` and regenerate the
 * file with the correct formatting using `node format.js --generate`.
 *
 * The formatting logic uses `JSON.stringify` with 2 spaces, which will keep
 * separating commas on the same line as any closing character. This technique
 * was chosen for simplicity and to align with common default JSON formatters,
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
} else if (process.argv[2] === "--check") {
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
        if (typeof item.pattern !== "object" || item.pattern === null || Array.isArray(item.pattern)) {
            console.error("Item is missing required pattern object with accepted and forbidden arrays:", item);
            process.exit(1);
        }
        if (!Array.isArray(item.pattern.accepted)) {
            console.error("Item pattern.accepted is missing or is not an array:", item);
            process.exit(1);
        }
        for (const pat of item.pattern.accepted) {
            if (typeof pat !== "string") {
                console.error("Pattern (accepted) entry was not a string:", item, pat);
                process.exit(1);
            }
        }
        if (!Array.isArray(item.pattern.forbidden)) {
            console.error("Item pattern.forbidden is missing or is not an array:", item);
            process.exit(1);
        }
        for (const pat of item.pattern.forbidden) {
            if (typeof pat !== "string") {
                console.error("Pattern (forbidden) entry was not a string:", item, pat);
                process.exit(1);
            }
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
            } else if (verify.type === "ip") {
                if (!Array.isArray(verify.sources)) {
                    console.error("Item IP validation entry is missing required `sources` array field:", item, verify);
                    process.exit(1);
                }
                for (const source of verify.sources) {
                    if (source.type !== "http-json") {
                        console.error("IP source `type` must be a valid type (currently only `http-json` is supported)", item, verify, source);
                        process.exit(1);
                    }

                    if (typeof source.url !== "string") {
                        console.error("IP source `url` must be a string", item, verify, source);
                        process.exit(1);
                    }

                    if (typeof source.selector !== "string") {
                        console.error("IP source `selector` must be a string", item, verify, source);
                        process.exit(1);
                    }
                }
            } else {
                console.error("Item validation entry is incorrect, only `ip`, `dns`, and `cidr` are supported:", item, verify);
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
            if (typeof item.instances !== "object" || item.instances === null || Array.isArray(item.instances)) {
                console.error(
                    "Item has wrong type specified for instances, it must be an object with accepted and rejected arrays:",
                    item
                );
                process.exit(1);
            }
            if (!Array.isArray(item.instances.accepted)) {
                console.error("Item instances.accepted is missing or is not an array:", item);
                process.exit(1);
            }
            if (!Array.isArray(item.instances.rejected)) {
                console.error("Item instances.rejected is missing or is not an array:", item);
                process.exit(1);
            }
            for (const instance of item.instances.accepted) {
                if (typeof instance !== "string") {
                    console.error("Instance was not a string:", item, instance);
                    process.exit(1);
                }
                for (const pat of item.pattern.accepted) {
                    let re;
                    try {
                        re = new RegExp(pat);
                    } catch (e) {
                        console.error("Invalid regex pattern in pattern.accepted:", pat, item);
                        process.exit(1);
                    }
                    if (!re.test(instance)) {
                        console.error("Instance in instances.accepted does not match the required accepted pattern:");
                        console.error(" pattern.accepted: ", pat);
                        console.error(" instance: ", instance);
                        process.exit(1);
                    }
                }
                for (const pat of item.pattern.forbidden) {
                    let re;
                    try {
                        re = new RegExp(pat);
                    } catch (e) {
                        console.error("Invalid regex pattern in pattern.forbidden:", pat, item);
                        process.exit(1);
                    }
                    if (re.test(instance)) {
                        console.error("Instance in instances.accepted should not match the forbidden pattern:");
                        console.error(" pattern.forbidden: ", pat);
                        console.error(" instance: ", instance);
                        process.exit(1);
                    }
                }
            }
            // We are testing that the instances would be accepted if not for the `forbidden` array.
            // This ensures that the forbidden regex works correctly and its not just failing
            // because it doesn't match the patterns in the `accepted` array.
            for (const instance of item.instances.rejected) {
                if (typeof instance !== "string") {
                    console.error("Rejected instance was not a string:", item, instance);
                    process.exit(1);
                }
                let matchesAllAccepted = true;
                for (const pat of item.pattern.accepted) {
                    let re;
                    try {
                        re = new RegExp(pat);
                    } catch (e) {
                        console.error("Invalid regex pattern in pattern.accepted:", pat, item);
                        process.exit(1);
                    }
                    if (!re.test(instance)) {
                        matchesAllAccepted = false;
                        break;
                    }
                }
                let matchesAnyForbidden = false;
                for (const pat of item.pattern.forbidden) {
                    let re;
                    try {
                        re = new RegExp(pat);
                    } catch (e) {
                        console.error("Invalid regex pattern in pattern.forbidden:", pat, item);
                        process.exit(1);
                    }
                    if (re.test(instance)) {
                        matchesAnyForbidden = true;
                        break;
                    }
                }
                // If the instance matches all accepted regexes and none of the forbidden,
                // then it qualifies as a match. This is not allowed for a rejected instance.
                if (matchesAllAccepted && !matchesAnyForbidden) {
                    console.error("Rejected instance in instances.rejected unexpectedly matches all accepted patterns and none of the forbidden patterns:");
                    console.error(" pattern.accepted: ", item.pattern.accepted);
                    console.error(" pattern.forbidden: ", item.pattern.forbidden);
                    console.error(" instance: ", instance);
                    process.exit(1);
                }
            }
        }
    }
} else {
    console.error("Valid subcommands are `--generate` or `--check`")
    process.exit(1);
}
