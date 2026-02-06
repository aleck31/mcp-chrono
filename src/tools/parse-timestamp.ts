import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime } from "luxon";

export function register(server: McpServer): void {
  server.tool(
    "parse_timestamp",
    "Parse a Unix timestamp (seconds or milliseconds) or ISO 8601 string into detailed date/time components.",
    {
      input: z.union([z.string(), z.number()]).describe("Unix timestamp (number in seconds or milliseconds) or ISO 8601 date string"),
      timezone: z.string().optional().describe("IANA timezone for output. Defaults to UTC."),
    },
    async ({ input, timezone }) => {
      const tz = timezone || "UTC";
      let dt: DateTime;

      if (typeof input === "number") {
        // Detect if seconds or milliseconds
        // Timestamps in seconds are typically < 10^10, milliseconds >= 10^10
        if (input > 1e12) {
          dt = DateTime.fromMillis(input, { zone: tz });
        } else {
          dt = DateTime.fromSeconds(input, { zone: tz });
        }
      } else {
        dt = DateTime.fromISO(input, { zone: tz });
        if (!dt.isValid) {
          // Try parsing as a numeric string
          const num = Number(input);
          if (!isNaN(num)) {
            if (num > 1e12) {
              dt = DateTime.fromMillis(num, { zone: tz });
            } else {
              dt = DateTime.fromSeconds(num, { zone: tz });
            }
          }
        }
      }

      if (!dt.isValid) {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Cannot parse input: ${input}` }) }] };
      }

      const result = {
        input: input,
        timezone: tz,
        iso: dt.toISO(),
        date: dt.toISODate(),
        time: dt.toISOTime(),
        year: dt.year,
        month: dt.month,
        day: dt.day,
        hour: dt.hour,
        minute: dt.minute,
        second: dt.second,
        weekday: dt.weekdayLong,
        weekOfYear: dt.weekNumber,
        dayOfYear: dt.ordinal,
        utcOffset: dt.toFormat("ZZ"),
        timestampSeconds: Math.floor(dt.toSeconds()),
        timestampMillis: dt.toMillis(),
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
