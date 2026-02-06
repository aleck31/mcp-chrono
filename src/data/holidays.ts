import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface HolidayInfo {
  date: string;        // YYYY-MM-DD
  name: string;
  isOffDay: boolean;   // true = day off, false = make-up workday
  type: "public_holiday" | "makeup_workday" | "regular";
}

// In-memory cache per country-year
const memoryCache = new Map<string, Map<string, HolidayInfo>>();

function getCacheDir(dataDir: string): string {
  return join(dataDir, "cache", "holidays");
}

function readDiskCache(dataDir: string, country: string, year: number): Map<string, HolidayInfo> | null {
  const dir = getCacheDir(dataDir);
  const file = join(dir, `${country}-${year}.json`);
  if (!existsSync(file)) return null;
  try {
    const data = JSON.parse(readFileSync(file, "utf-8")) as HolidayInfo[];
    const map = new Map<string, HolidayInfo>();
    for (const h of data) map.set(h.date, h);
    return map;
  } catch {
    return null;
  }
}

function writeDiskCache(dataDir: string, country: string, year: number, holidays: HolidayInfo[]): void {
  const dir = getCacheDir(dataDir);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${country}-${year}.json`);
  writeFileSync(file, JSON.stringify(holidays, null, 2), "utf-8");
}

async function fetchChinaHolidays(year: number): Promise<HolidayInfo[]> {
  const results: HolidayInfo[] = [];
  try {
    const res = await fetch(`https://timor.tech/api/holiday/year/${year}`);
    if (!res.ok) return results;
    const data = await res.json() as any;
    if (data.code !== 0 || !data.holiday) return results;
    for (const [dateStr, info] of Object.entries(data.holiday) as [string, any][]) {
      const fullDate = dateStr.startsWith(`${year}`) ? dateStr : `${year}-${dateStr}`;
      // Normalize to YYYY-MM-DD
      const parts = fullDate.split("-");
      const normalized = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      results.push({
        date: normalized,
        name: info.name || "",
        isOffDay: info.holiday === true,
        type: info.holiday === true ? "public_holiday" : "makeup_workday",
      });
    }
  } catch {
    // Network error, return empty
  }
  return results;
}

async function fetchNagerHolidays(year: number, countryCode: string): Promise<HolidayInfo[]> {
  const results: HolidayInfo[] = [];
  try {
    const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/${countryCode}`);
    if (!res.ok) return results;
    const data = await res.json() as any[];
    for (const item of data) {
      results.push({
        date: item.date,
        name: item.localName || item.name || "",
        isOffDay: true,
        type: "public_holiday",
      });
    }
  } catch {
    // Network error
  }
  return results;
}

export async function getHolidays(dataDir: string, country: string, year: number): Promise<Map<string, HolidayInfo>> {
  const key = `${country}-${year}`;

  // 1. Memory cache
  if (memoryCache.has(key)) return memoryCache.get(key)!;

  // 2. Disk cache
  const diskCached = readDiskCache(dataDir, country, year);
  if (diskCached) {
    memoryCache.set(key, diskCached);
    return diskCached;
  }

  // 3. Fetch from API
  let holidays: HolidayInfo[];
  if (country.toUpperCase() === "CN") {
    holidays = await fetchChinaHolidays(year);
  } else {
    holidays = await fetchNagerHolidays(year, country.toUpperCase());
  }

  const map = new Map<string, HolidayInfo>();
  for (const h of holidays) map.set(h.date, h);

  // Write caches if we got data
  if (holidays.length > 0) {
    writeDiskCache(dataDir, country, year, holidays);
  }
  memoryCache.set(key, map);
  return map;
}

export function getHolidayInfoSync(dataDir: string, country: string, year: number, date: string): HolidayInfo | undefined {
  const key = `${country}-${year}`;
  const cached = memoryCache.get(key);
  if (cached) return cached.get(date);

  const diskCached = readDiskCache(dataDir, country, year);
  if (diskCached) {
    memoryCache.set(key, diskCached);
    return diskCached.get(date);
  }
  return undefined;
}
