import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DateTime } from "luxon";
import { Solar, Lunar } from "lunar-typescript";
import { resolveFestivalDate } from "../data/festivals-cn.js";
import { resolveUSFestivalDate } from "../data/festivals-us.js";

export function register(server: McpServer): void {
  server.tool(
    "calculate_time",
    "Add or subtract time from a date. Supports Gregorian mode, Lunar mode, and anchor mode (calculate relative to a named festival).",
    {
      mode: z.enum(["gregorian", "lunar", "anchor"]).optional().describe("Calculation mode. Defaults to 'gregorian'."),
      base_date: z.string().optional().describe("Base date in ISO format (YYYY-MM-DD or full ISO 8601). Required for gregorian/lunar modes."),
      timezone: z.string().optional().describe("IANA timezone for the base date. Defaults to UTC."),
      years: z.number().int().optional().describe("Years to add (negative to subtract)"),
      months: z.number().int().optional().describe("Months to add (negative to subtract)"),
      days: z.number().int().optional().describe("Days to add (negative to subtract)"),
      hours: z.number().int().optional().describe("Hours to add (negative to subtract)"),
      minutes: z.number().int().optional().describe("Minutes to add (negative to subtract)"),
      // Anchor mode params
      festival: z.string().optional().describe("Festival name for anchor mode (e.g. '春节', 'Christmas', 'Thanksgiving')"),
      festival_year: z.number().int().optional().describe("Year to resolve festival date for anchor mode"),
    },
    async ({ mode, base_date, timezone, years, months, days, hours, minutes, festival, festival_year }) => {
      try {
        const calcMode = mode || "gregorian";
        const tz = timezone || "UTC";

        let baseDateTime: DateTime;

        if (calcMode === "anchor") {
          if (!festival) {
            return { content: [{ type: "text", text: JSON.stringify({ error: "festival is required for anchor mode" }) }] };
          }
          const festYear = festival_year || DateTime.now().year;

          // Try Chinese festivals first
          let resolved = resolveFestivalDate(festival, festYear);
          if (resolved) {
            baseDateTime = DateTime.fromObject(
              { year: resolved.getYear(), month: resolved.getMonth(), day: resolved.getDay() },
              { zone: tz }
            );
          } else {
            // Try US festivals
            const usResult = resolveUSFestivalDate(festival, festYear);
            if (usResult) {
              baseDateTime = DateTime.fromObject(
                { year: festYear, month: usResult.month, day: usResult.day },
                { zone: tz }
              );
            } else {
              return { content: [{ type: "text", text: JSON.stringify({ error: `Festival not found: ${festival}` }) }] };
            }
          }
        } else if (!base_date) {
          return { content: [{ type: "text", text: JSON.stringify({ error: "base_date is required for gregorian/lunar modes" }) }] };
        } else {
          baseDateTime = DateTime.fromISO(base_date, { zone: tz });
        }

        if (!baseDateTime!.isValid) {
          return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid date: ${baseDateTime!.invalidExplanation}` }) }] };
        }

        if (calcMode === "lunar") {
          // Convert to lunar, add, convert back
          const solar = Solar.fromYmd(baseDateTime!.year, baseDateTime!.month, baseDateTime!.day);
          const lunar = solar.getLunar();

          // Add days using Lunar.next()
          let totalLunarDays = (days || 0);
          // For months in lunar calendar, approximate as 30 days per month
          // Actually, let's handle months by manipulating lunar month/day directly
          let targetLunar: Lunar;

          if (months || years) {
            // Calculate target lunar date
            let targetMonth = lunar.getMonth() + (months || 0);
            let targetYear = lunar.getYear() + (years || 0);

            // Normalize months
            while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
            while (targetMonth < 1) { targetMonth += 12; targetYear--; }

            let targetDay = lunar.getDay();
            // Clamp day to valid range
            try {
              targetLunar = Lunar.fromYmd(targetYear, targetMonth, targetDay);
            } catch {
              // Day doesn't exist in target month, use last valid day
              try {
                targetLunar = Lunar.fromYmd(targetYear, targetMonth, 29);
              } catch {
                targetLunar = Lunar.fromYmd(targetYear, targetMonth, 28);
              }
            }
          } else {
            targetLunar = lunar;
          }

          // Then add remaining days
          if (totalLunarDays !== 0) {
            targetLunar = targetLunar.next(totalLunarDays);
          }

          const resultSolar = targetLunar.getSolar();
          let resultDt = DateTime.fromObject(
            { year: resultSolar.getYear(), month: resultSolar.getMonth(), day: resultSolar.getDay() },
            { zone: tz }
          );

          // Add hours/minutes in Gregorian space
          if (hours) resultDt = resultDt.plus({ hours });
          if (minutes) resultDt = resultDt.plus({ minutes });

          const result = {
            mode: "lunar",
            base: {
              gregorian: baseDateTime!.toISODate(),
              lunar: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
            },
            offset: { years: years || 0, months: months || 0, days: days || 0, hours: hours || 0, minutes: minutes || 0 },
            result: {
              gregorian: resultDt.toISO(),
              lunar: `${targetLunar.getYearInChinese()}年${targetLunar.getMonthInChinese()}月${targetLunar.getDayInChinese()}`,
              lunarYear: targetLunar.getYear(),
              lunarMonth: targetLunar.getMonth(),
              lunarDay: targetLunar.getDay(),
            },
          };

          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        // Gregorian mode (also used for anchor after resolving base)
        const resultDt = baseDateTime!.plus({
          years: years || 0,
          months: months || 0,
          days: days || 0,
          hours: hours || 0,
          minutes: minutes || 0,
        });

        const result: Record<string, unknown> = {
          mode: calcMode,
          base: baseDateTime!.toISO(),
          offset: { years: years || 0, months: months || 0, days: days || 0, hours: hours || 0, minutes: minutes || 0 },
          result: resultDt.toISO(),
          resultDate: resultDt.toISODate(),
          weekday: resultDt.weekdayLong,
        };

        if (calcMode === "anchor") {
          result.festival = festival;
          result.festivalYear = festival_year || DateTime.now().year;
        }

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message || String(e) }) }] };
      }
    }
  );
}
