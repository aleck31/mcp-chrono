import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Solar, Lunar } from "lunar-typescript";

export function register(server: McpServer): void {
  server.tool(
    "convert_calendar",
    "Convert between Gregorian (solar) and Chinese Lunar calendar. Includes Ganzhi (天干地支), zodiac animal, solar terms, and festival information.",
    {
      direction: z.enum(["gregorian_to_lunar", "lunar_to_gregorian"]).describe("Conversion direction"),
      year: z.number().int().describe("Year"),
      month: z.number().int().min(1).max(12).describe("Month (1-12)"),
      day: z.number().int().min(1).max(31).describe("Day"),
      isLeapMonth: z.boolean().optional().describe("For lunar_to_gregorian: whether the month is a leap month (闰月). Defaults to false."),
    },
    async ({ direction, year, month, day, isLeapMonth }) => {
      try {
        if (direction === "gregorian_to_lunar") {
          const solar = Solar.fromYmd(year, month, day);
          const lunar = solar.getLunar();

          const result = {
            input: { type: "gregorian", year, month, day },
            lunar: {
              year: lunar.getYear(),
              month: lunar.getMonth(),
              day: lunar.getDay(),
              yearInChinese: lunar.getYearInChinese(),
              monthInChinese: lunar.getMonthInChinese(),
              dayInChinese: lunar.getDayInChinese(),
              yearGanZhi: lunar.getYearInGanZhi(),
              monthGanZhi: lunar.getMonthInGanZhi(),
              dayGanZhi: lunar.getDayInGanZhi(),
              zodiac: lunar.getYearShengXiao(),
              solarTerm: lunar.getJieQi() || null,
              lunarFestivals: lunar.getFestivals(),
              solarFestivals: solar.getFestivals(),
              constellation: solar.getXingZuo(),
            },
          };

          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } else {
          // lunar_to_gregorian
          // If isLeapMonth is true, use negative month number per lunar-typescript convention
          const lunarMonth = isLeapMonth ? -month : month;
          const lunar = Lunar.fromYmd(year, lunarMonth, day);
          const solar = lunar.getSolar();

          const result = {
            input: { type: "lunar", year, month, day, isLeapMonth: isLeapMonth || false },
            gregorian: {
              year: solar.getYear(),
              month: solar.getMonth(),
              day: solar.getDay(),
              iso: solar.toYmd(),
              weekday: solar.getWeekInChinese(),
            },
            lunarInfo: {
              yearGanZhi: lunar.getYearInGanZhi(),
              monthGanZhi: lunar.getMonthInGanZhi(),
              dayGanZhi: lunar.getDayInGanZhi(),
              zodiac: lunar.getYearShengXiao(),
              lunarFestivals: lunar.getFestivals(),
              solarFestivals: solar.getFestivals(),
            },
          };

          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
      } catch (e: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: e.message || String(e) }) }],
        };
      }
    }
  );
}
