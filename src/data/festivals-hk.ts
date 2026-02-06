import { Lunar, Solar } from "lunar-typescript";

export interface HKFestival {
  name: string;
  nameZh: string;
  rule: HKFixedRule | HKLunarRule | HKSpecialRule;
}

interface HKFixedRule {
  type: "fixed";
  month: number;
  day: number;
}

interface HKLunarRule {
  type: "lunar";
  lunarMonth: number;
  lunarDay: number;
}

interface HKSpecialRule {
  type: "special";
  resolve: (year: number) => { month: number; day: number } | null;
}

/**
 * Hong Kong public holidays (法定公众假期).
 * Includes both fixed solar dates and lunar-based holidays.
 */
export const HK_FESTIVALS: HKFestival[] = [
  // Fixed solar holidays
  { name: "New Year's Day", nameZh: "元旦", rule: { type: "fixed", month: 1, day: 1 } },
  { name: "Labour Day", nameZh: "劳动节", rule: { type: "fixed", month: 5, day: 1 } },
  { name: "HKSAR Establishment Day", nameZh: "香港特别行政区成立纪念日", rule: { type: "fixed", month: 7, day: 1 } },
  { name: "National Day", nameZh: "国庆日", rule: { type: "fixed", month: 10, day: 1 } },
  { name: "Christmas Day", nameZh: "圣诞节", rule: { type: "fixed", month: 12, day: 25 } },
  { name: "Boxing Day", nameZh: "圣诞节翌日", rule: { type: "fixed", month: 12, day: 26 } },

  // Lunar-based holidays
  { name: "Lunar New Year's Day", nameZh: "农历年初一", rule: { type: "lunar", lunarMonth: 1, lunarDay: 1 } },
  { name: "Lunar New Year's Day 2", nameZh: "农历年初二", rule: { type: "lunar", lunarMonth: 1, lunarDay: 2 } },
  { name: "Lunar New Year's Day 3", nameZh: "农历年初三", rule: { type: "lunar", lunarMonth: 1, lunarDay: 3 } },
  { name: "Buddha's Birthday", nameZh: "佛诞", rule: { type: "lunar", lunarMonth: 4, lunarDay: 8 } },
  { name: "Tuen Ng Festival", nameZh: "端午节", rule: { type: "lunar", lunarMonth: 5, lunarDay: 5 } },
  { name: "Mid-Autumn Festival", nameZh: "中秋节翌日", rule: { type: "lunar", lunarMonth: 8, lunarDay: 16 } },
  { name: "Chung Yeung Festival", nameZh: "重阳节", rule: { type: "lunar", lunarMonth: 9, lunarDay: 9 } },

  // Special calculation holidays
  {
    name: "Ching Ming Festival",
    nameZh: "清明节",
    rule: {
      type: "special",
      resolve: (year: number) => {
        // Ching Ming is a solar term, typically April 4 or 5
        // Use lunar-typescript to find the exact date
        const solar4 = Solar.fromYmd(year, 4, 4);
        const lunar4 = solar4.getLunar();
        if (lunar4.getJieQi() === "清明") {
          return { month: 4, day: 4 };
        }
        const solar5 = Solar.fromYmd(year, 4, 5);
        const lunar5 = solar5.getLunar();
        if (lunar5.getJieQi() === "清明") {
          return { month: 4, day: 5 };
        }
        // Fallback: scan April 3-6
        for (let d = 3; d <= 6; d++) {
          const s = Solar.fromYmd(year, 4, d);
          if (s.getLunar().getJieQi() === "清明") {
            return { month: 4, day: d };
          }
        }
        return { month: 4, day: 5 }; // default
      },
    },
  },
  {
    name: "Easter Monday",
    nameZh: "复活节星期一",
    rule: {
      type: "special",
      resolve: (year: number) => {
        // Computus algorithm for Easter Sunday
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        // Easter Monday = Easter Sunday + 1
        const easterSunday = new Date(year, month - 1, day);
        const easterMonday = new Date(easterSunday);
        easterMonday.setDate(easterMonday.getDate() + 1);
        return { month: easterMonday.getMonth() + 1, day: easterMonday.getDate() };
      },
    },
  },
  {
    name: "Good Friday",
    nameZh: "耶稣受难节",
    rule: {
      type: "special",
      resolve: (year: number) => {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        // Good Friday = Easter Sunday - 2
        const easterSunday = new Date(year, month - 1, day);
        const goodFriday = new Date(easterSunday);
        goodFriday.setDate(goodFriday.getDate() - 2);
        return { month: goodFriday.getMonth() + 1, day: goodFriday.getDate() };
      },
    },
  },
  {
    name: "Day after Good Friday",
    nameZh: "耶稣受难节翌日",
    rule: {
      type: "special",
      resolve: (year: number) => {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        const easterSunday = new Date(year, month - 1, day);
        const sat = new Date(easterSunday);
        sat.setDate(sat.getDate() - 1);
        return { month: sat.getMonth() + 1, day: sat.getDate() };
      },
    },
  },
];

/**
 * Resolve an HK festival name to a { month, day } in the Gregorian calendar for a given year.
 * Returns null if not found.
 */
export function resolveHKFestivalDate(name: string, year: number): { month: number; day: number } | null {
  const festival = HK_FESTIVALS.find(
    f => f.name.toLowerCase() === name.toLowerCase() || f.nameZh === name
  );
  if (!festival) return null;

  const rule = festival.rule;

  if (rule.type === "fixed") {
    return { month: rule.month, day: rule.day };
  }

  if (rule.type === "lunar") {
    try {
      const lunar = Lunar.fromYmd(year, rule.lunarMonth, rule.lunarDay);
      const solar = lunar.getSolar();
      return { month: solar.getMonth(), day: solar.getDay() };
    } catch {
      return null;
    }
  }

  if (rule.type === "special") {
    return rule.resolve(year);
  }

  return null;
}

/**
 * Get all HK public holidays for a given year with their resolved Gregorian dates.
 */
export function getAllHKFestivals(year: number): Array<{ name: string; nameZh: string; month: number; day: number; date: string }> {
  const results: Array<{ name: string; nameZh: string; month: number; day: number; date: string }> = [];

  for (const festival of HK_FESTIVALS) {
    const resolved = resolveHKFestivalDate(festival.name, year);
    if (resolved) {
      const m = String(resolved.month).padStart(2, "0");
      const d = String(resolved.day).padStart(2, "0");
      results.push({
        name: festival.name,
        nameZh: festival.nameZh,
        month: resolved.month,
        day: resolved.day,
        date: `${year}-${m}-${d}`,
      });
    }
  }

  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}
