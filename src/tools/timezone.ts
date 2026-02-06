import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime } from "luxon";
import { searchTimezones } from "../data/timezone-meta.js";

export function register(server: McpServer): void {
  // convert_timezone
  server.tool(
    "convert_timezone",
    "Convert a datetime from one timezone to another. Input can be an ISO 8601 string.",
    {
      datetime: z.string().describe("ISO 8601 datetime string (e.g. 2024-01-15T10:30:00)"),
      from_timezone: z.string().describe("Source IANA timezone (e.g. Asia/Shanghai)"),
      to_timezone: z.string().describe("Target IANA timezone (e.g. America/New_York)"),
    },
    async ({ datetime, from_timezone, to_timezone }) => {
      const source = DateTime.fromISO(datetime, { zone: from_timezone });

      if (!source.isValid) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Invalid datetime or source timezone: ${source.invalidExplanation}` }) }],
        };
      }

      const target = source.setZone(to_timezone);

      if (!target.isValid) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Invalid target timezone: ${to_timezone}` }) }],
        };
      }

      const result = {
        original: {
          datetime: source.toISO(),
          timezone: from_timezone,
          utcOffset: source.toFormat("ZZ"),
        },
        converted: {
          datetime: target.toISO(),
          timezone: to_timezone,
          utcOffset: target.toFormat("ZZ"),
        },
        timeDifference: `${target.offset - source.offset} minutes`,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // list_timezones
  server.tool(
    "list_timezones",
    "List IANA timezones with current offset and time. Uses the system's full IANA timezone database. Can filter by query text or continent.",
    {
      query: z.string().optional().describe("Search text to filter by timezone name, city, or Chinese name"),
      continent: z.string().optional().describe("Filter by continent prefix (Asia, Europe, America, Africa, Australia, Pacific, etc.)"),
    },
    async ({ query, continent }) => {
      const results = searchTimezones(query, continent);

      return {
        content: [{ type: "text", text: JSON.stringify({ count: results.length, timezones: results }, null, 2) }],
      };
    }
  );
}
