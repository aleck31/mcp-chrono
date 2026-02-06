export interface USFestival {
  name: string;
  rule: FixedDateRule | NthWeekdayRule;
}

interface FixedDateRule {
  type: "fixed";
  month: number;
  day: number;
}

interface NthWeekdayRule {
  type: "nth_weekday";
  month: number;
  weekday: number;  // 0=Sunday, 1=Monday, ...
  n: number;        // which occurrence (1-based), -1 for last
}

export const US_FESTIVALS: USFestival[] = [
  { name: "New Year's Day", rule: { type: "fixed", month: 1, day: 1 } },
  { name: "Martin Luther King Jr. Day", rule: { type: "nth_weekday", month: 1, weekday: 1, n: 3 } },
  { name: "Presidents' Day", rule: { type: "nth_weekday", month: 2, weekday: 1, n: 3 } },
  { name: "Memorial Day", rule: { type: "nth_weekday", month: 5, weekday: 1, n: -1 } },
  { name: "Independence Day", rule: { type: "fixed", month: 7, day: 4 } },
  { name: "Labor Day", rule: { type: "nth_weekday", month: 9, weekday: 1, n: 1 } },
  { name: "Columbus Day", rule: { type: "nth_weekday", month: 10, weekday: 1, n: 2 } },
  { name: "Veterans Day", rule: { type: "fixed", month: 11, day: 11 } },
  { name: "Thanksgiving", rule: { type: "nth_weekday", month: 11, weekday: 4, n: 4 } },
  { name: "Christmas", rule: { type: "fixed", month: 12, day: 25 } },
];

/**
 * Resolve a US festival name to a { month, day } for a given year.
 * Returns null if not found.
 */
export function resolveUSFestivalDate(name: string, year: number): { month: number; day: number } | null {
  const festival = US_FESTIVALS.find(f => f.name.toLowerCase() === name.toLowerCase());
  if (!festival) return null;

  const rule = festival.rule;
  if (rule.type === "fixed") {
    return { month: rule.month, day: rule.day };
  }

  // nth_weekday
  if (rule.n === -1) {
    // Last occurrence of weekday in month
    // Start from last day of month and go backward
    const lastDay = new Date(year, rule.month, 0).getDate();
    for (let d = lastDay; d >= 1; d--) {
      const dt = new Date(year, rule.month - 1, d);
      if (dt.getDay() === rule.weekday) {
        return { month: rule.month, day: d };
      }
    }
  } else {
    // Nth occurrence
    let count = 0;
    const daysInMonth = new Date(year, rule.month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, rule.month - 1, d);
      if (dt.getDay() === rule.weekday) {
        count++;
        if (count === rule.n) {
          return { month: rule.month, day: d };
        }
      }
    }
  }

  return null;
}
