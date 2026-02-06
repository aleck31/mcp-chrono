import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime, Info } from "luxon";

export function register(server: McpServer): void {
  server.tool(
    "get_month_info",
    "Get detailed information about a specific month including number of days, first/last day weekday, whether it's a leap year, and quarter.",
    {
      year: z.number().int().describe("Year (e.g. 2024)"),
      month: z.number().int().min(1).max(12).describe("Month (1-12)"),
    },
    async ({ year, month }) => {
      const dt = DateTime.fromObject({ year, month, day: 1 });

      if (!dt.isValid) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Invalid year/month" }) }] };
      }

      const daysInMonth = dt.daysInMonth!;
      const lastDay = DateTime.fromObject({ year, month, day: daysInMonth });

      const result = {
        year,
        month,
        monthName: dt.monthLong,
        daysInMonth,
        firstDayWeekday: dt.weekdayLong,
        firstDayWeekdayNumber: dt.weekday, // 1=Monday, 7=Sunday (ISO)
        lastDayWeekday: lastDay.weekdayLong,
        lastDayWeekdayNumber: lastDay.weekday,
        isLeapYear: dt.isInLeapYear,
        quarter: dt.quarter,
        weekCount: Math.ceil((daysInMonth + dt.weekday - 1) / 7),
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
