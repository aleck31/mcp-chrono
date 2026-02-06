import { DateTime } from "luxon";

export interface TimezoneInfo {
  iana: string;
  continent: string;
  city: string;
  currentOffset: string;
  currentTime: string;
}

/** Chinese translations for common city names extracted from IANA IDs. */
const CITY_CN: Record<string, string> = {
  Shanghai: "上海", Hong_Kong: "香港", Taipei: "台北", Tokyo: "东京",
  Seoul: "首尔", Singapore: "新加坡", Kuala_Lumpur: "吉隆坡", Bangkok: "曼谷",
  Ho_Chi_Minh: "胡志明市", Jakarta: "雅加达", Manila: "马尼拉", Kolkata: "加尔各答",
  Mumbai: "孟买", Dhaka: "达卡", Karachi: "卡拉奇", Tashkent: "塔什干",
  Almaty: "阿拉木图", Dubai: "迪拜", Riyadh: "利雅得", Tehran: "德黑兰",
  Baghdad: "巴格达", Jerusalem: "耶路撒冷", Beirut: "贝鲁特", Colombo: "科伦坡",
  Yangon: "仰光", Kathmandu: "加德满都", Vladivostok: "海参崴",
  Novosibirsk: "新西伯利亚", London: "伦敦", Paris: "巴黎", Berlin: "柏林",
  Rome: "罗马", Madrid: "马德里", Amsterdam: "阿姆斯特丹", Brussels: "布鲁塞尔",
  Zurich: "苏黎世", Vienna: "维也纳", Stockholm: "斯德哥尔摩", Oslo: "奥斯陆",
  Copenhagen: "哥本哈根", Helsinki: "赫尔辛基", Warsaw: "华沙", Prague: "布拉格",
  Budapest: "布达佩斯", Bucharest: "布加勒斯特", Athens: "雅典",
  Istanbul: "伊斯坦布尔", Moscow: "莫斯科", Lisbon: "里斯本", Dublin: "都柏林",
  Kyiv: "基辅", New_York: "纽约", Chicago: "芝加哥", Denver: "丹佛",
  Los_Angeles: "洛杉矶", Anchorage: "安克雷奇", Honolulu: "檀香山",
  Toronto: "多伦多", Vancouver: "温哥华", Mexico_City: "墨西哥城",
  Sao_Paulo: "圣保罗", Buenos_Aires: "布宜诺斯艾利斯", Lima: "利马",
  Bogota: "波哥大", Santiago: "圣地亚哥", Cairo: "开罗", Lagos: "拉各斯",
  Johannesburg: "约翰内斯堡", Nairobi: "内罗毕", Casablanca: "卡萨布兰卡",
  Sydney: "悉尼", Melbourne: "墨尔本", Perth: "珀斯", Brisbane: "布里斯班",
  Auckland: "奥克兰", Fiji: "苏瓦",
};

function getCityFromIana(iana: string): string {
  const parts = iana.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
}

function getCityCn(iana: string): string | undefined {
  const parts = iana.split("/");
  const key = parts[parts.length - 1];
  return CITY_CN[key];
}

function getContinentFromIana(iana: string): string {
  return iana.split("/")[0];
}

/**
 * Get all IANA timezones from the runtime, with optional filtering.
 * Uses Intl.supportedValuesOf('timeZone') for a complete, system-maintained list.
 */
export function searchTimezones(query?: string, continent?: string): TimezoneInfo[] {
  let zones: string[];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    // Fallback for older runtimes
    zones = [];
  }
  // Always include UTC
  if (!zones.includes("UTC")) zones.push("UTC");

  let results = zones;

  if (continent) {
    const c = continent.toLowerCase();
    results = results.filter(tz => getContinentFromIana(tz).toLowerCase() === c);
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(tz => {
      const cn = getCityCn(tz) || "";
      return (
        tz.toLowerCase().includes(q) ||
        getCityFromIana(tz).toLowerCase().includes(q) ||
        cn.includes(q)
      );
    });
  }

  return results.map(tz => {
    const now = DateTime.now().setZone(tz);
    const city = getCityFromIana(tz);
    const cn = getCityCn(tz);
    return {
      iana: tz,
      continent: getContinentFromIana(tz),
      city: cn ? `${city} (${cn})` : city,
      currentOffset: now.isValid ? now.toFormat("ZZ") : "N/A",
      currentTime: now.isValid ? now.toFormat("HH:mm") : "N/A",
    };
  });
}
