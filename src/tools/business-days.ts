import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime } from "luxon";
import { getHolidays, type HolidayInfo } from "../data/holidays.js";

export function register(server: McpServer, dataDir: string): void {
  server.tool(
    "calculate_business_days",
    "Calculate business days between two dates or add/subtract business days from a date. Skips weekends and optionally public holidays.",
    {
      action: z.enum(["count", "add"]).describe("'count': count business days between from and to. 'add': add N business days to from date."),
      from: z.string().describe("Start date in YYYY-MM-DD format"),
      to: z.string().optional().describe("End date in YYYY-MM-DD format (required for 'count' action)"),
      business_days: z.number().int().optional().describe("Number of business days to add (required for 'add' action, negative to subtract)"),
      country: z.string().optional().describe("Country code for public holidays (e.g. CN, US). If omitted, only weekends are skipped."),
      timezone: z.string().optional().describe("IANA timezone. Defaults to UTC."),
    },
    async ({ action, from, to, business_days, country, timezone }) => {
      try {
        const tz = timezone || "UTC";
        const fromDt = DateTime.fromISO(from, { zone: tz });

        if (!fromDt.isValid) {
          return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid from date: ${fromDt.invalidExplanation}` }) }] };
        }

        // Load holidays if country specified
        let holidayMap: Map<string, HolidayInfo> | undefined;
        if (country) {
          // Load holidays for relevant years
          const allHolidays = new Map<string, HolidayInfo>();
          const startYear = fromDt.year;
          const endYear = to ? DateTime.fromISO(to, { zone: tz }).year : startYear + 1;
          for (let y = startYear; y <= endYear; y++) {
            const yearHolidays = await getHolidays(dataDir, country, y);
            for (const [k, v] of yearHolidays) allHolidays.set(k, v);
          }
          holidayMap = allHolidays;
        }

        function isBusinessDay(dt: DateTime): { isBusiness: boolean; reason?: string } {
          const weekday = dt.weekday; // 1=Mon, 7=Sun
          const dateStr = dt.toISODate()!;

          // Check holiday map first (it may have makeup workdays)
          if (holidayMap) {
            const holiday = holidayMap.get(dateStr);
            if (holiday) {
              if (holiday.type === "makeup_workday") {
                // It's a makeup workday (even if weekend)
                return { isBusiness: true };
              }
              if (holiday.isOffDay) {
                return { isBusiness: false, reason: holiday.name };
              }
            }
          }

          if (weekday === 6 || weekday === 7) {
            return { isBusiness: false, reason: "weekend" };
          }

          return { isBusiness: true };
        }

        if (action === "count") {
          if (!to) {
            return { content: [{ type: "text", text: JSON.stringify({ error: "'to' date is required for count action" }) }] };
          }

          const toDt = DateTime.fromISO(to, { zone: tz });
          if (!toDt.isValid) {
            return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid to date: ${toDt.invalidExplanation}` }) }] };
          }

          let count = 0;
          const excluded: { date: string; reason: string }[] = [];
          let current = fromDt;

          while (current < toDt) {
            const check = isBusinessDay(current);
            if (check.isBusiness) {
              count++;
            } else {
              excluded.push({ date: current.toISODate()!, reason: check.reason || "non-business" });
            }
            current = current.plus({ days: 1 });
          }

          const totalCalendarDays = Math.floor(toDt.diff(fromDt, "days").days);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                from: fromDt.toISODate(),
                to: toDt.toISODate(),
                businessDays: count,
                calendarDays: totalCalendarDays,
                excludedDays: excluded.length,
                excluded: excluded.slice(0, 50), // Limit to 50 entries
              }, null, 2),
            }],
          };
        } else {
          // add
          if (business_days === undefined) {
            return { content: [{ type: "text", text: JSON.stringify({ error: "'business_days' is required for add action" }) }] };
          }

          const direction = business_days >= 0 ? 1 : -1;
          let remaining = Math.abs(business_days);
          let current = fromDt;
          const excluded: { date: string; reason: string }[] = [];

          while (remaining > 0) {
            current = current.plus({ days: direction });
            const check = isBusinessDay(current);
            if (check.isBusiness) {
              remaining--;
            } else {
              excluded.push({ date: current.toISODate()!, reason: check.reason || "non-business" });
            }
          }

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                from: fromDt.toISODate(),
                businessDaysAdded: business_days,
                result: current.toISODate(),
                weekday: current.weekdayLong,
                excludedDays: excluded.length,
                excluded: excluded.slice(0, 50),
              }, null, 2),
            }],
          };
        }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message || String(e) }) }] };
      }
    }
  );
}
