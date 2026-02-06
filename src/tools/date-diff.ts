import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime, Interval } from "luxon";

export function register(server: McpServer): void {
  server.tool(
    "date_diff",
    "Calculate the difference between two dates/times. Returns the difference in years, months, days, hours, minutes and also total days/hours/minutes.",
    {
      start: z.string().describe("Start date in ISO 8601 format (e.g. 2024-01-15 or 2024-01-15T10:30:00)"),
      end: z.string().describe("End date in ISO 8601 format"),
      timezone: z.string().optional().describe("IANA timezone for parsing dates. Defaults to UTC."),
    },
    async ({ start, end, timezone }) => {
      const tz = timezone || "UTC";
      const startDt = DateTime.fromISO(start, { zone: tz });
      const endDt = DateTime.fromISO(end, { zone: tz });

      if (!startDt.isValid) {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid start date: ${startDt.invalidExplanation}` }) }] };
      }
      if (!endDt.isValid) {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid end date: ${endDt.invalidExplanation}` }) }] };
      }

      // Ensure start <= end for interval
      const [earlier, later] = startDt < endDt ? [startDt, endDt] : [endDt, startDt];
      const isNegative = startDt > endDt;

      const interval = Interval.fromDateTimes(earlier, later);
      const duration = interval.toDuration(["years", "months", "days", "hours", "minutes", "seconds"]);
      const totalDiff = later.diff(earlier, ["days", "hours", "minutes", "seconds"]);

      const result = {
        start: startDt.toISO(),
        end: endDt.toISO(),
        timezone: tz,
        isNegative,
        difference: {
          years: duration.years,
          months: duration.months,
          days: duration.days,
          hours: duration.hours,
          minutes: duration.minutes,
          seconds: Math.floor(duration.seconds),
        },
        totalDays: Math.floor(totalDiff.as("days")),
        totalHours: Math.floor(totalDiff.as("hours")),
        totalMinutes: Math.floor(totalDiff.as("minutes")),
        totalSeconds: Math.floor(totalDiff.as("seconds")),
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
