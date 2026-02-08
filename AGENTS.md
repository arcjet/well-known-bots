# Agent Onboarding Guide

This document helps coding agents work efficiently with the well-known-bots repository.

## Repository Overview

This repository maintains a curated list of well-known bots, crawlers, validators, monitors, and spiders in a single JSON file (`well-known-bots.json`). The file contains 600+ bot definitions with regex patterns for User-Agent matching and metadata for verification.

### Key Files

- **`well-known-bots.json`**: Main data file (~13,653 lines) containing bot definitions
- **`validate.js`**: Validation and formatting script - THE MOST IMPORTANT TOOL
- **`.github/workflows/ci-validation.yml`**: CI workflow that runs validation on every push/PR

## Working with This Repository

### No Package Manager Required

This is a **data repository** with NO package.json or dependencies. It uses only Node.js built-in modules.

- ❌ **DO NOT** run `npm install`, `npm init`, or any package manager commands
- ❌ **DO NOT** create a package.json file
- ✅ **DO** use Node.js directly to run scripts (e.g., `node validate.js --check`)

### Validation Script (Critical)

The `validate.js` script is your primary tool. It has TWO modes:

1. **Check mode**: `node validate.js --check`
   - Validates JSON formatting (2 spaces, proper newlines)
   - Validates all required fields exist and have correct types
   - Validates regex patterns compile correctly
   - Validates instances match/don't match their patterns
   - **ALWAYS run this before committing any changes**

2. **Generate mode**: `node validate.js --generate`
   - Automatically reformats the JSON file with correct formatting
   - Use this if formatting is incorrect
   - **IMPORTANT**: Only use when you need to fix formatting

### Making Changes to well-known-bots.json

When adding or modifying bot entries, refer to the [README.md](README.md) for:
- Complete field descriptions and structure
- Available categories
- Verification methods and examples
- How to add a new bot

**Quick reference** - Required fields for every bot entry:
- `id`: string - Unique identifier (kebab-case)
- `categories`: array - At least one category
- `pattern`: object with `accepted` and `forbidden` arrays of regex strings
- `verification`: array - Can be empty `[]` or contain verification methods

**Pattern validation rules**:
- All regex patterns in `pattern.accepted` must be valid
- All regex patterns in `pattern.forbidden` must be valid
- If `instances.accepted` is provided, all strings must match ALL accepted patterns and NONE of the forbidden patterns
- If `instances.rejected` is provided, strings must either not match all accepted patterns OR match at least one forbidden pattern

### Common Workflows

#### Adding a New Bot

1. Edit `well-known-bots.json` to add your bot entry (see README.md for structure)
2. Validate your changes: `node validate.js --check`
3. If formatting is wrong, auto-fix it: `node validate.js --generate`
4. Validate again to ensure correctness: `node validate.js --check`

#### Modifying an Existing Bot

1. Find the bot entry in `well-known-bots.json`
2. Make your changes
3. Always validate: `node validate.js --check`

### CI/CD Pipeline

The repository uses GitHub Actions for validation:

- **Trigger**: Runs on every push and pull request
- **What it does**: Executes `node validate.js --check`
- **Node version**: 20.x
- **Location**: `.github/workflows/ci-validation.yml`

All PRs must pass validation before merging.

## Common Errors and Solutions

### Error: "JSON file format is wrong"

**Cause**: Incorrect indentation or line breaks in the JSON file.

**Solution**:
```bash
node validate.js --generate
node validate.js --check
```

### Error: "Item is missing required `X` field"

**Cause**: A bot entry is missing a required field.

**Solution**: Add the missing field. Required fields are: `id`, `categories`, `pattern`, `verification`.

### Error: "Instance in instances.accepted does not match the required accepted pattern"

**Cause**: An example user-agent string in `instances.accepted` doesn't match the regex patterns in `pattern.accepted`.

**Solution**: Either fix the regex pattern or fix the example instance to match.

### Error: "Pattern entry was not a string"

**Cause**: A pattern in `pattern.accepted` or `pattern.forbidden` is not a string.

**Solution**: Ensure all patterns are strings, not other types.

### Error: "Invalid regex pattern"

**Cause**: A regex pattern cannot be compiled by JavaScript's RegExp.

**Solution**: Fix the regex syntax. Remember to escape special characters properly.

## File Editing Best Practices

1. **JSON Editing**:
   - Use 2-space indentation
   - Keep the JSON structure consistent with existing entries
   - Let `node validate.js --generate` handle formatting if unsure

2. **Regex Patterns**:
   - Test patterns before adding them
   - Escape special regex characters: `\` (backslash for literal chars like `\/`)
   - Remember: Patterns are tested with JavaScript's RegExp engine

3. **Verification Data**:
   - Only add verification if the bot provider offers a reliable verification method
   - Most bots (570/600) have no verification - this is normal
   - Verify URLs are accessible before adding them. If you cannot load the URL then flag it for human verification in the pull request.

## Testing Your Changes

Since this is a data repository with no test suite, validation IS the testing:

```bash
# Run validation - this is your test suite
node validate.js --check

# Expected output: (nothing) with exit code 0
# If there are errors, they will be printed to stderr
```

## Tips for Agents

1. **Always validate** before committing changes
2. **Don't create build artifacts** - this is a data-only repo
3. **Read the README.md** for context on the project's purpose
4. **Check existing entries** for examples when adding new bots
5. **Use `node validate.js --generate`** to fix formatting issues automatically
6. **Focus on data quality** - this file is consumed by other projects

## Example Bot Entry

A minimal valid bot entry:

```json
{
  "id": "example-bot",
  "categories": ["search-engine"],
  "pattern": {
    "accepted": ["ExampleBot\\/"],
    "forbidden": []
  },
  "verification": []
}
```

For detailed examples with verification methods, see the [Verification Methods](README.md#verification-methods) section in the README.

## Need Help?

- Check existing bot entries in `well-known-bots.json` for examples
- Review `validate.js` to understand validation rules
- See the README.md for project background and usage
