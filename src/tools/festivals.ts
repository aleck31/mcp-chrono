import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Solar } from "lunar-typescript";
import { DateTime } from "luxon";
import { getHolidays } from "../data/holidays.js";

interface FestivalEntry {
  date: string;
  lunarDate?: string;
  festivals: string[];
  solarTerm?: string;
  isPublicHoliday?: boolean;
  holidayName?: string;
}

export function register(server: McpServer, dataDir: string): void {
  server.tool(
    "get_festivals",
    "Get festivals, solar terms, and public holidays within a date range. Supports Chinese (lunar and solar) festivals and public holidays from various countries.",
    {
      start_date: z.string().describe("Start date in YYYY-MM-DD format"),
      end_date: z.string().describe("End date in YYYY-MM-DD format"),
      country: z.string().optional().describe("Country code for public holidays (e.g. CN, US, HK). Defaults to CN."),
      types: z.array(z.enum(["lunar_festival", "solar_festival", "solar_term", "public_holiday"])).optional()
        .describe("Filter by event types. If omitted, returns all types."),
    },
    async ({ start_date, end_date, country, types }) => {
      try {
        const countryCode = country || "CN";
        const startDt = DateTime.fromISO(start_date);
        const endDt = DateTime.fromISO(end_date);

        if (!startDt.isValid || !endDt.isValid) {
          return { content: [{ type: "text", text: JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." }) }] };
        }

        // Preload holidays for the year range
        const startYear = startDt.year;
        const endYear = endDt.year;
        const holidayMaps = new Map<number, Map<string, any>>();
        for (let y = startYear; y <= endYear; y++) {
          holidayMaps.set(y, await getHolidays(dataDir, countryCode, y));
        }

        const entries: FestivalEntry[] = [];
        let current = startDt;

        while (current <= endDt) {
          const y = current.year;
          const m = current.month;
          const d = current.day;
          const dateStr = current.toISODate()!;

          const solar = Solar.fromYmd(y, m, d);
          const lunar = solar.getLunar();

          const entry: FestivalEntry = {
            date: dateStr,
            festivals: [],
          };

          // Lunar info
          entry.lunarDate = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

          // Solar term
          const jieQi = lunar.getJieQi();
          if (jieQi) {
            if (!types || types.includes("solar_term")) {
              entry.solarTerm = jieQi;
            }
          }

          // Lunar festivals
          const lunarFestivals = lunar.getFestivals();
          if (lunarFestivals.length > 0 && (!types || types.includes("lunar_festival"))) {
            entry.festivals.push(...lunarFestivals);
          }

          // Solar festivals
          const solarFestivals = solar.getFestivals();
          if (solarFestivals.length > 0 && (!types || types.includes("solar_festival"))) {
            entry.festivals.push(...solarFestivals);
          }

          // Other festivals (from lunar-typescript)
          const otherLunar = lunar.getOtherFestivals();
          if (otherLunar.length > 0 && (!types || types.includes("lunar_festival"))) {
            entry.festivals.push(...otherLunar);
          }
          const otherSolar = solar.getOtherFestivals();
          if (otherSolar.length > 0 && (!types || types.includes("solar_festival"))) {
            entry.festivals.push(...otherSolar);
          }

          // Public holidays from API cache
          if (!types || types.includes("public_holiday")) {
            const holidayMap = holidayMaps.get(y);
            if (holidayMap) {
              const holiday = holidayMap.get(dateStr);
              if (holiday) {
                entry.isPublicHoliday = holiday.isOffDay;
                entry.holidayName = holiday.name;
              }
            }
          }

          // Only include days with something interesting
          if (entry.festivals.length > 0 || entry.solarTerm || entry.isPublicHoliday !== undefined) {
            entries.push(entry);
          }

          current = current.plus({ days: 1 });
        }

        return {
          content: [{ type: "text", text: JSON.stringify({ count: entries.length, entries }, null, 2) }],
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message || String(e) }) }] };
      }
    }
  );
}
