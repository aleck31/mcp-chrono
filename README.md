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

| Tool | Description |
|------|-------------|
| `get_current_time` | Get current time in any IANA timezone with detailed components (weekday, week of year, day of year, UTC offset, etc.) |
| `convert_timezone` | Convert a datetime between two IANA timezones |
| `list_timezones` | Search IANA timezones with current offsets and Chinese city names |
| `parse_timestamp` | Parse Unix timestamps (seconds/milliseconds) or ISO 8601 strings into date components |

### Date Calculation

| Tool | Description |
|------|-------------|
| `calculate_time` | Add/subtract time from a date. Three modes: **gregorian** (standard), **lunar** (Chinese calendar arithmetic), **anchor** (offset from a named festival like 春节 or Thanksgiving) |
| `date_diff` | Difference between two dates in years, months, days, hours, minutes, and total counts |
| `countdown` | Countdown from now to a target date with remaining days/hours/minutes/seconds |
| `calculate_business_days` | Count or add business days, skipping weekends and optionally public holidays (supports CN makeup workdays) |

### Calendar & Festivals

| Tool | Description |
|------|-------------|
| `convert_calendar` | Convert between Gregorian and Chinese Lunar calendar. Returns Ganzhi (干支), zodiac, solar terms, festivals, constellation |
| `get_festivals` | List festivals, solar terms, and public holidays within a date range. Filterable by type |
| `get_month_info` | Month details: day count, first/last weekday, leap year, quarter, week count |

### Chinese Almanac

| Tool | Description |
|------|-------------|
| `get_almanac` | Chinese almanac (黄历) for a date: 宜 (suitable) / 忌 (avoid) activities, lucky directions (喜神/财神/福神), conflict zodiac, 彭祖百忌, 吉神宜趋, 凶煞宜忌, 天神, 纳音, and more |

### Persistent Countdowns

| Tool | Description |
|------|-------------|
| `manage_countdown` | CRUD for persistent countdown timers (set / get / list / delete), stored as JSON on disk |

## Supported Regions

| Region | Festivals | Public Holiday API |
|--------|-----------|-------------------|
| CN | 27 festivals (lunar + solar) | [timor.tech](https://timor.tech) (includes makeup workdays) |
| US | 10 federal holidays | [date.nager.at](https://date.nager.at) |
| HK | 17 public holidays (lunar, Easter, Ching Ming, fixed) | [date.nager.at](https://date.nager.at) |

## License

MIT
