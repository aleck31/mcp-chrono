# mcp-chrono

MCP server providing time, calendar, timezone, Chinese lunar calendar, almanac, and date utilities for AI agents.

## Quick Start

### Using npx (no installation needed)

```bash
npx mcp-chrono
```

### Global install

```bash
npm install -g mcp-chrono
mcp-chrono
```

## Usage with MCP Clients

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "chrono": {
      "command": "npx",
      "args": ["-y", "mcp-chrono"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add chrono -- npx -y mcp-chrono
```

Or with a custom data directory:

```bash
claude mcp add chrono -- npx -y mcp-chrono --data-dir /path/to/data
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "chrono": {
      "command": "npx",
      "args": ["-y", "mcp-chrono"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "chrono": {
      "command": "npx",
      "args": ["-y", "mcp-chrono"]
    }
  }
}
```

### Generic MCP client (mcp.json)

Any MCP-compatible client can use the standard `mcp.json` format:

```json
{
  "mcpServers": {
    "chrono": {
      "command": "npx",
      "args": ["-y", "mcp-chrono"],
      "transportType": "stdio"
    }
  }
}
```

With custom data directory:

```json
{
  "mcpServers": {
    "chrono": {
      "command": "npx",
      "args": ["-y", "mcp-chrono", "--data-dir", "/path/to/data"],
      "transportType": "stdio"
    }
  }
}
```

## Data Directory

Holiday API responses are cached locally to avoid repeated network requests. Default location: `~/.mcp-chrono/`

Override with `--data-dir`:

```bash
npx mcp-chrono --data-dir /tmp/mcp-chrono-data
```

## Tools

### Time & Timezone

#### `get_current_time`

Get current time in any IANA timezone with detailed components (timestamp, weekday, week of year, day of year, UTC offset, etc.)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timezone` | string | No | `UTC` | IANA timezone (e.g. `Asia/Shanghai`, `America/New_York`) |
| `format` | string | No | `iso` | Output format: `iso`, `human`, or `relative` |

#### `convert_timezone`

Convert a datetime between two IANA timezones.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `datetime` | string | Yes | ISO 8601 datetime (e.g. `2024-01-15T10:30:00`) |
| `from_timezone` | string | Yes | Source IANA timezone |
| `to_timezone` | string | Yes | Target IANA timezone |

#### `list_timezones`

Search IANA timezones with current offsets and Chinese city names.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search by timezone name, city, or Chinese name |
| `continent` | string | No | Filter by continent (e.g. `Asia`, `Europe`, `America`) |

#### `parse_timestamp`

Parse Unix timestamps (seconds/milliseconds) or ISO 8601 strings into date components.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `input` | string \| number | Yes | - | Unix timestamp (seconds or milliseconds) or ISO 8601 string |
| `timezone` | string | No | `UTC` | IANA timezone for output |

---

### Date Calculation

#### `calculate_time`

Add/subtract time from a date. Returns a new date after applying the offset.

Three modes: **gregorian** (standard date arithmetic), **lunar** (Chinese calendar arithmetic), **anchor** (offset from a named festival like 春节 or Thanksgiving).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `mode` | string | No | `gregorian` | Calculation mode: `gregorian`, `lunar`, or `anchor` |
| `base_date` | string | No | now | Base date in ISO format. Defaults to current time if omitted |
| `timezone` | string | No | `UTC` | IANA timezone for the base date |
| `years` | integer | No | - | Years to add (negative to subtract) |
| `months` | integer | No | - | Months to add (negative to subtract) |
| `days` | integer | No | - | Days to add (negative to subtract) |
| `hours` | integer | No | - | Hours to add (negative to subtract) |
| `minutes` | integer | No | - | Minutes to add (negative to subtract) |
| `festival` | string | No | - | Festival name for `anchor` mode (e.g. `春节`, `Christmas`, `Thanksgiving`) |
| `festival_year` | integer | No | - | Year to resolve festival date for `anchor` mode |

#### `date_diff`

Calculate the difference between two dates in years, months, days, hours, minutes, and total counts.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start` | string | Yes | - | Start date in ISO 8601 format |
| `end` | string | Yes | - | End date in ISO 8601 format |
| `timezone` | string | No | `UTC` | IANA timezone for parsing dates |

#### `countdown`

Countdown from now to a target date with remaining days/hours/minutes/seconds.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | string | Yes | - | Target date/time in ISO 8601 format |
| `timezone` | string | No | `UTC` | IANA timezone for the target date |

#### `calculate_business_days`

Count or add business days, skipping weekends and optionally public holidays (supports CN makeup workdays).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | Yes | - | `count` (count business days between two dates) or `add` (add business days to a date) |
| `from` | string | Yes | - | Start date in `YYYY-MM-DD` format |
| `to` | string | No | - | End date in `YYYY-MM-DD` format (required for `count`) |
| `business_days` | integer | No | - | Number of business days to add (required for `add`, negative to subtract) |
| `country` | string | No | - | Country code for public holidays (e.g. `CN`, `US`) |
| `timezone` | string | No | `UTC` | IANA timezone |

---

### Calendar & Festivals

#### `convert_calendar`

Convert between Gregorian and Chinese Lunar calendar. Returns Ganzhi (干支), zodiac, solar terms, festivals, constellation.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `direction` | string | Yes | - | `gregorian_to_lunar` or `lunar_to_gregorian` |
| `year` | integer | Yes | - | Year |
| `month` | integer | Yes | - | Month (1–12) |
| `day` | integer | Yes | - | Day (1–31) |
| `isLeapMonth` | boolean | No | `false` | For `lunar_to_gregorian`: whether the month is a leap month (闰月) |

#### `get_festivals`

List festivals, solar terms, and public holidays within a date range. Filterable by type.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | string | Yes | - | Start date in `YYYY-MM-DD` format |
| `end_date` | string | Yes | - | End date in `YYYY-MM-DD` format |
| `country` | string | No | `CN` | Country code for public holidays (e.g. `CN`, `US`, `HK`) |
| `types` | string[] | No | - | Filter by type: `lunar_festival`, `solar_festival`, `solar_term`, `public_holiday` |

#### `get_month_info`

Month details: day count, first/last weekday, leap year, quarter, week count.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | integer | Yes | Year (e.g. 2024) |
| `month` | integer | Yes | Month (1–12) |

---

### Chinese Almanac

#### `get_almanac`

Chinese almanac (黄历) for a date: 宜/忌 activities, lucky directions (喜神/财神/福神), conflict zodiac, 彭祖百忌, 吉神宜趋, 凶煞宜忌, 天神, 纳音, and more.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string | No | today | Date in `YYYY-MM-DD` format |

---

### Persistent Countdowns

#### `manage_countdown`

CRUD for persistent countdown timers, stored as JSON on disk.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | Yes | - | `set`, `get`, `list`, or `delete` |
| `id` | string | No | - | Countdown ID (required for `get` / `delete`; auto-generated for `set` if omitted) |
| `name` | string | No | - | Name/description (required for `set`) |
| `target_date` | string | No | - | Target date in ISO 8601 format (required for `set`) |
| `timezone` | string | No | `UTC` | IANA timezone |

## Supported Regions

| Region | Festivals | Public Holiday API |
|--------|-----------|-------------------|
| CN | 27 festivals (lunar + solar) | [timor.tech](https://timor.tech) (includes makeup workdays) |
| US | 10 federal holidays | [date.nager.at](https://date.nager.at) |
| HK | 17 public holidays (lunar, Easter, Ching Ming, fixed) | [date.nager.at](https://date.nager.at) |

## License

MIT
