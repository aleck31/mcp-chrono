import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime } from "luxon";

export function register(server: McpServer): void {
  server.tool(
    "get_current_time",
    "Get the current time in a specified timezone. Returns detailed time information including year, month, day, hour, minute, second, weekday, week of year, day of year, and UTC offset.",
    {
      timezone: z.string().optional().describe("IANA timezone (e.g. Asia/Shanghai, America/New_York). Defaults to UTC."),
      format: z.enum(["iso", "human", "relative"]).optional().describe("Output format: iso (default), human (readable), relative (time ago from UTC)"),
    },
    async ({ timezone, format }) => {
      const tz = timezone || "UTC";
      const now = DateTime.now().setZone(tz);

      if (!now.isValid) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Invalid timezone: ${tz}` }) }],
        };
      }

      const fmt = format || "iso";

      const result: Record<string, unknown> = {
        timezone: tz,
        timestamp: now.toMillis(),
        year: now.year,
        month: now.month,
        day: now.day,
        hour: now.hour,
        minute: now.minute,
        second: now.second,
        weekday: now.weekdayLong,
        weekOfYear: now.weekNumber,
        dayOfYear: now.ordinal,
        utcOffset: now.toFormat("ZZ"),
      };

      if (fmt === "iso") {
        result.datetime = now.toISO();
      } else if (fmt === "human") {
        result.datetime = now.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
      } else if (fmt === "relative") {
        const diff = now.diffNow(["hours", "minutes", "seconds"]);
        result.datetime = now.toISO();
        result.relativeToUTC = `${diff.hours}h ${diff.minutes}m ${Math.floor(diff.seconds)}s`;
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
