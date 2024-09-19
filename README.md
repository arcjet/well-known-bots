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

## License

The project is a hard-fork of [crawler-user-agents][forked-repo-url] at commit
`46831767324e10c69c9ac6e538c9847853a0feb9`, which is distributed under the [MIT
License][mit-license].

[raw-json-url]: https://raw.githubusercontent.com/arcjet/well-known-bots/main/well-known-bots.json
[forked-repo-url]: https://github.com/monperrus/crawler-user-agents/commit/46831767324e10c69c9ac6e538c9847853a0feb9
[non-tech-notes-url]: https://github.com/niespodd/browser-fingerprinting/blob/baecc60821cefd06eb89a54d18be39d87dd16f2e/README.md#non-technical-notes
[mit-license]: https://opensource.org/licenses/MIT
