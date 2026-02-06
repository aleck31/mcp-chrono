import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime } from "luxon";

export function register(server: McpServer): void {
  server.tool(
    "countdown",
    "Calculate a countdown from now to a target date/time. Returns remaining days, hours, minutes, seconds and whether the date is in the past.",
    {
      target: z.string().describe("Target date/time in ISO 8601 format (e.g. 2024-12-31T23:59:59 or 2025-01-01)"),
      timezone: z.string().optional().describe("IANA timezone for the target date. Defaults to UTC."),
    },
    async ({ target, timezone }) => {
      const tz = timezone || "UTC";
      const now = DateTime.now().setZone(tz);
      const targetDt = DateTime.fromISO(target, { zone: tz });

      if (!targetDt.isValid) {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid target date: ${targetDt.invalidExplanation}` }) }] };
      }

      const isPast = targetDt < now;
      const [earlier, later] = isPast ? [targetDt, now] : [now, targetDt];
      const diff = later.diff(earlier, ["days", "hours", "minutes", "seconds"]);

      const result = {
        now: now.toISO(),
        target: targetDt.toISO(),
        timezone: tz,
        isPast,
        remaining: {
          days: Math.floor(diff.days),
          hours: Math.floor(diff.hours),
          minutes: Math.floor(diff.minutes),
          seconds: Math.floor(diff.seconds),
        },
        totalDays: Math.floor(diff.as("days")),
        totalHours: Math.floor(diff.as("hours")),
        totalSeconds: Math.floor(diff.as("seconds")),
        summary: isPast
          ? `${Math.floor(diff.as("days"))} days ago`
          : `${Math.floor(diff.as("days"))} days remaining`,
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
