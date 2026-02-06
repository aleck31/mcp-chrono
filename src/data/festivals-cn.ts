import { Lunar, Solar } from "lunar-typescript";

export interface ChineseFestival {
  name: string;
  nameEn: string;
  lunarMonth?: number;
  lunarDay?: number;
  solarMonth?: number;
  solarDay?: number;
  type: "lunar" | "solar";
}

export const CHINESE_FESTIVALS: ChineseFestival[] = [
  { name: "\u6625\u8282", nameEn: "Spring Festival", lunarMonth: 1, lunarDay: 1, type: "lunar" },
  { name: "\u5143\u5bb5\u8282", nameEn: "Lantern Festival", lunarMonth: 1, lunarDay: 15, type: "lunar" },
  { name: "\u9f99\u62ac\u5934", nameEn: "Dragon Head Raising", lunarMonth: 2, lunarDay: 2, type: "lunar" },
  { name: "\u4e0a\u5df3\u8282", nameEn: "Shangsi Festival", lunarMonth: 3, lunarDay: 3, type: "lunar" },
  { name: "\u6e05\u660e\u8282", nameEn: "Qingming Festival", solarMonth: 4, solarDay: 5, type: "solar" },
  { name: "\u7aef\u5348\u8282", nameEn: "Dragon Boat Festival", lunarMonth: 5, lunarDay: 5, type: "lunar" },
  { name: "\u4e03\u5915\u8282", nameEn: "Qixi Festival", lunarMonth: 7, lunarDay: 7, type: "lunar" },
  { name: "\u4e2d\u5143\u8282", nameEn: "Ghost Festival", lunarMonth: 7, lunarDay: 15, type: "lunar" },
  { name: "\u4e2d\u79cb\u8282", nameEn: "Mid-Autumn Festival", lunarMonth: 8, lunarDay: 15, type: "lunar" },
  { name: "\u91cd\u9633\u8282", nameEn: "Double Ninth Festival", lunarMonth: 9, lunarDay: 9, type: "lunar" },
  { name: "\u5bd2\u8863\u8282", nameEn: "Hanyi Festival", lunarMonth: 10, lunarDay: 1, type: "lunar" },
  { name: "\u4e0b\u5143\u8282", nameEn: "Xiayuan Festival", lunarMonth: 10, lunarDay: 15, type: "lunar" },
  { name: "\u51ac\u81f3", nameEn: "Winter Solstice", solarMonth: 12, solarDay: 22, type: "solar" },
  { name: "\u814a\u516b\u8282", nameEn: "Laba Festival", lunarMonth: 12, lunarDay: 8, type: "lunar" },
  { name: "\u5c0f\u5e74", nameEn: "Little New Year", lunarMonth: 12, lunarDay: 23, type: "lunar" },
  { name: "\u9664\u5915", nameEn: "New Year's Eve", lunarMonth: 12, lunarDay: 30, type: "lunar" },
  // Solar holidays
  { name: "\u5143\u65e6", nameEn: "New Year's Day", solarMonth: 1, solarDay: 1, type: "solar" },
  { name: "\u60c5\u4eba\u8282", nameEn: "Valentine's Day", solarMonth: 2, solarDay: 14, type: "solar" },
  { name: "\u5987\u5973\u8282", nameEn: "Women's Day", solarMonth: 3, solarDay: 8, type: "solar" },
  { name: "\u690d\u6811\u8282", nameEn: "Arbor Day", solarMonth: 3, solarDay: 12, type: "solar" },
  { name: "\u52b3\u52a8\u8282", nameEn: "Labour Day", solarMonth: 5, solarDay: 1, type: "solar" },
  { name: "\u9752\u5e74\u8282", nameEn: "Youth Day", solarMonth: 5, solarDay: 4, type: "solar" },
  { name: "\u513f\u7ae5\u8282", nameEn: "Children's Day", solarMonth: 6, solarDay: 1, type: "solar" },
  { name: "\u5efa\u515a\u8282", nameEn: "CPC Founding Day", solarMonth: 7, solarDay: 1, type: "solar" },
  { name: "\u5efa\u519b\u8282", nameEn: "Army Day", solarMonth: 8, solarDay: 1, type: "solar" },
  { name: "\u6559\u5e08\u8282", nameEn: "Teachers' Day", solarMonth: 9, solarDay: 10, type: "solar" },
  { name: "\u56fd\u5e86\u8282", nameEn: "National Day", solarMonth: 10, solarDay: 1, type: "solar" },
];

/**
 * Resolve a Chinese festival name to a Solar date for a given year.
 * For lunar festivals, `year` is the lunar year.
 * Returns null if festival not found.
 */
export function resolveFestivalDate(name: string, year: number): Solar | null {
  const festival = CHINESE_FESTIVALS.find(f => f.name === name || f.nameEn.toLowerCase() === name.toLowerCase());
  if (!festival) return null;

  if (festival.type === "solar" && festival.solarMonth && festival.solarDay) {
    return Solar.fromYmd(year, festival.solarMonth, festival.solarDay);
  }

  if (festival.type === "lunar" && festival.lunarMonth && festival.lunarDay) {
    try {
      // Handle \u9664\u5915 specially - it's the last day of the lunar year
      // lunar-typescript may not have day 30 for some months
      const lunar = Lunar.fromYmd(year, festival.lunarMonth, festival.lunarDay);
      return lunar.getSolar();
    } catch {
      // If the lunar date doesn't exist (e.g., no 30th day), try 29th for \u9664\u5915
      if (festival.name === "\u9664\u5915") {
        try {
          const lunar = Lunar.fromYmd(year, 12, 29);
          return lunar.getSolar();
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  return null;
}
