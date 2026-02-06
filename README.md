# Well Known Bots

This repository contains a list of Well Known Bots, including robots, crawlers,
validators, monitors, and spiders, in a single JSON file. Each bot is identified
and provided a RegExp `pattern` to match against an HTTP `User-Agent` header.
Additional metadata is available on each item.

## Install

### Direct download

Download the [`well-known-bots.json` file][raw-json-url] directly.

## Realities

It's impossible to create a system that can detect all bots. Well-behaving bots
identify themselves in a consistent manner, usually via the User-Agent patterns
this project provides. It is straightforward to identify these well-behaving
bots, but misbehaving bots pretend to be real clients and use various mechanisms
to evade detection.

For more details, see [Non-Technical Notes in the
browser-fingerprinting][non-tech-notes-url] project.

## Custom bots

To block a particular bot that is not on this list,
you can use an Arcjet filter.
See the [Malicious traffic][arcjet-blueprint-malicious-traffic] blueprint for how to
block custom bots.

## Structure

Each entry in the JSON represents a specific bot or crawler and includes the following fields:

- id: A unique identifier for the bot
- categories: An array of categories the bot belongs to (e.g., "search-engine", "advertising")
- pattern: A regular expression pattern used to identify the bot in user agent strings
- url: (optional) A URL with more information about the bot
- verification: A list of supported methods for verifying the bot's identity (if the bot is not verifiable it should be empty).
- instances: An array of example user agent strings for the bot
- aliases: Extra unique identifiers for the bot that can be used to identify it across other data sources

### Verification

Each verification entry contains the following fields:

- type: The method of verification (`dns` and `cidr` are supported)

If you specify `dns` verification then these fields are expected:

- masks: An array of mask patterns used for verification

If you specify `cidr` verification then these fields are expected:

- sources: An array of sources to pull cidr range data from (at least one is required)

### Verification mask patterns

The mask patterns use the following special characters:

- *: Represents 0 or 1 of any character
- @: Acts as a wildcard, matching any number of characters

All other characters in the mask require an exact match.

### Cidr verification sources

Each cidr source requires the following fields:

- type: The type of source (`http-json` or `http-csv`) is supported
- url: The url that hosts the ip ranges
- selector: (`http-json` only) A JsonPath selector that selects all of the IP ranges in the source

For `http-csv` the `url` should point to a file with a format where the IP CIDRs are in the first column.

## License

The project is a hard-fork of [crawler-user-agents][forked-repo-url] at commit
`46831767324e10c69c9ac6e538c9847853a0feb9`, which is distributed under the [MIT
License][mit-license].

[arcjet-blueprint-malicious-traffic]: https://docs.arcjet.com/blueprints/malicious-traffic
[raw-json-url]: https://raw.githubusercontent.com/arcjet/well-known-bots/main/well-known-bots.json
[forked-repo-url]: https://github.com/monperrus/crawler-user-agents/commit/46831767324e10c69c9ac6e538c9847853a0feb9
[non-tech-notes-url]: https://github.com/niespodd/browser-fingerprinting/blob/baecc60821cefd06eb89a54d18be39d87dd16f2e/README.md#non-technical-notes
[mit-license]: https://opensource.org/licenses/MIT
