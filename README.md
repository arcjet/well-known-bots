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

## Adding a New Bot

To add a new bot to the list, you need to edit the `well-known-bots.json` file and add a new entry. Follow these steps:

1. **Create a new bot entry** with the required fields (see structure below)
2. **Add User-Agent pattern(s)** that identify the bot
3. **Add verification method(s)** if the bot provider supports verification
4. **Add example instances** to validate your patterns work correctly
5. **Run validation** to ensure your entry is correct: `node validate.js --check`
6. **Submit a pull request** with your changes

### Bot Entry Structure

Each entry in the JSON represents a specific bot or crawler and includes the following fields:

#### Required Fields

- **`id`** (string): A unique identifier for the bot in kebab-case (e.g., `"google-crawler"`)
- **`categories`** (array): One or more categories the bot belongs to (see [available categories](#available-categories))
- **`pattern`** (object): Regular expression patterns to match the bot's User-Agent
  - **`accepted`** (array): Regex patterns that must match for bot identification
  - **`forbidden`** (array): Regex patterns that, if matched, disqualify the User-Agent
- **`verification`** (array): Methods for verifying the bot's authenticity (can be empty `[]` if not supported)

#### Optional Fields

- **`url`** (string): Documentation URL for the bot
- **`instances`** (object): Example User-Agent strings for testing
  - **`accepted`** (array): User-Agent strings that should match the pattern
  - **`rejected`** (array): User-Agent strings that should not match
- **`aliases`** (array): Alternative identifiers for the bot used in other data sources
- **`addition_date`** (string): Date the bot was added in YYYY/MM/DD format

### Available Categories

```
academic, advertising, ai, amazon, apple, archive, feedfetcher, google,
meta, microsoft, monitor, optimizer, preview, programmatic, search-engine,
slack, social, tool, unknown, vercel, webhook, yahoo
```

## Verification Methods

Bot verification allows you to confirm that a request claiming to be from a specific bot actually originates from that bot's infrastructure. Three verification methods are supported: DNS, CIDR, and IP.

### DNS Verification

DNS verification uses reverse DNS lookups to verify a bot's identity. The bot's IP address is resolved to a hostname, which is then checked against known patterns.

**When to use:** When the bot provider publishes DNS patterns for their crawlers (e.g., Google, Bing).

**Example:**

```json
{
  "type": "dns",
  "masks": [
    "crawl-***-***-***-***.googlebot.com",
    "geo-crawl-***-***-***-***.geo.googlebot.com"
  ]
}
```

**Mask pattern syntax:**
- `*` - Matches zero or one occurrence of any character
- `@` - Matches any number of characters (wildcard)
- All other characters require an exact match

**Full example in context:**

```json
{
  "id": "example-search-bot",
  "categories": ["search-engine"],
  "pattern": {
    "accepted": ["ExampleBot\\/"],
    "forbidden": []
  },
  "verification": [
    {
      "type": "dns",
      "masks": [
        "crawler-***.example.com"
      ]
    }
  ]
}
```

### CIDR Verification

CIDR verification checks if the request originates from IP address ranges (CIDR blocks) published by the bot provider.

**When to use:** When the bot provider publishes IP ranges in CIDR notation (e.g., Google, Stripe).

**Supported source types:**
- `http-json` - JSON file with CIDR ranges (or a mix of individual IPs and CIDR ranges)
- `http-csv` - CSV file with CIDR ranges in the first column (or a mix of individual IPs and CIDR ranges)
- `http-text` - Plain text file with one CIDR range per line (or a mix of individual IPs and CIDR ranges)

**Example with JSON source:**

```json
{
  "type": "cidr",
  "sources": [
    {
      "type": "http-json",
      "url": "https://developers.google.com/static/search/apis/ipranges/googlebot.json",
      "selector": "$.prefixes[*][\"ipv6Prefix\",\"ipv4Prefix\"]"
    }
  ]
}
```

**Example with CSV source:**

```json
{
  "type": "cidr",
  "sources": [
    {
      "type": "http-csv",
      "url": "https://example.com/ip-ranges.csv"
    }
  ]
}
```

**JSONPath selector examples:**
- `$.prefixes[*].cidr` - Array of objects with a `cidr` field
- `$[*]` - Simple array of CIDR strings
- `$.ranges[*]` - Nested array under `ranges` key

### IP Verification

IP verification checks if the request originates from specific IP addresses. This method supports both static IP lists and remote sources.

**When to use:** 
- Static IPs: When the bot uses a small, fixed set of IP addresses
- Remote sources: When the bot provider publishes a dynamic list of IPs

#### Static IP Addresses

For a small, fixed list of IP addresses:

```json
{
  "type": "ip",
  "ips": [
    "35.204.201.174",
    "34.125.202.46"
  ]
}
```

**Full example in context:**

```json
{
  "id": "small-monitoring-bot",
  "categories": ["monitor"],
  "pattern": {
    "accepted": ["MonitorBot"],
    "forbidden": []
  },
  "verification": [
    {
      "type": "ip",
      "ips": [
        "1.2.3.4",
        "5.6.7.8"
      ]
    }
  ]
}
```

#### Remote IP Sources

For dynamic or large lists, use remote sources:

**Supported source types:**
- `http-json` - JSON file with IP addresses (or a mix of individual IPs and CIDR ranges)
- `http-text` - Plain text file with one IP per line (or a mix of individual IPs and CIDR ranges)

**Example with JSON source:**

```json
{
  "type": "ip",
  "sources": [
    {
      "type": "http-json",
      "url": "https://stripe.com/files/ips/ips_webhooks.json",
      "selector": "$.WEBHOOKS[*]"
    }
  ]
}
```

**Example with text source:**

```json
{
  "type": "ip",
  "sources": [
    {
      "type": "http-text",
      "url": "https://my.pingdom.com/probes/ipv4"
    }
  ]
}
```

**JSONPath selector examples:**
- `$[*]` - Simple array of IP strings
- `$[*].ip` - Array of objects with an `ip` field
- `$.WEBHOOKS[*]` - Array of IPs under `WEBHOOKS` key
- `$.*[*]` - Object with arrays of IPs as values

### Multiple Verification Methods

You can specify multiple verification methods for a single bot. All methods should be valid for verifying the bot's identity:

```json
{
  "id": "google-crawler",
  "verification": [
    {
      "type": "cidr",
      "sources": [
        {
          "type": "http-json",
          "url": "https://developers.google.com/static/search/apis/ipranges/googlebot.json",
          "selector": "$.prefixes[*][\"ipv6Prefix\",\"ipv4Prefix\"]"
        }
      ]
    },
    {
      "type": "dns",
      "masks": [
        "crawl-***-***-***-***.googlebot.com"
      ]
    }
  ]
}
```

## License

The project is a hard-fork of [crawler-user-agents][forked-repo-url] at commit
`46831767324e10c69c9ac6e538c9847853a0feb9`, which is distributed under the [MIT
License][mit-license].

[arcjet-blueprint-malicious-traffic]: https://docs.arcjet.com/blueprints/malicious-traffic
[raw-json-url]: https://raw.githubusercontent.com/arcjet/well-known-bots/main/well-known-bots.json
[forked-repo-url]: https://github.com/monperrus/crawler-user-agents/commit/46831767324e10c69c9ac6e538c9847853a0feb9
[non-tech-notes-url]: https://github.com/niespodd/browser-fingerprinting/blob/baecc60821cefd06eb89a54d18be39d87dd16f2e/README.md#non-technical-notes
[mit-license]: https://opensource.org/licenses/MIT
