import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Solar } from "lunar-typescript";

export function register(server: McpServer): void {
  server.tool(
    "get_almanac",
    "Get Chinese almanac (黄历/老黄历) information for a specific date. Includes suitable activities (宜), things to avoid (忌), conflict zodiac (冲), lucky directions, and more.",
    {
      date: z.string().optional().describe("Date in YYYY-MM-DD format. Defaults to today."),
    },
    async ({ date }) => {
      try {
        let solar: Solar;
        if (date) {
          const [y, m, d] = date.split("-").map(Number);
          solar = Solar.fromYmd(y, m, d);
        } else {
          solar = Solar.fromDate(new Date());
        }

        const lunar = solar.getLunar();

        const result = {
          date: solar.toYmd(),
          lunar: {
            year: lunar.getYear(),
            month: lunar.getMonth(),
            day: lunar.getDay(),
            yearInChinese: lunar.getYearInChinese(),
            monthInChinese: lunar.getMonthInChinese(),
            dayInChinese: lunar.getDayInChinese(),
          },
          ganZhi: {
            year: lunar.getYearInGanZhi(),
            month: lunar.getMonthInGanZhi(),
            day: lunar.getDayInGanZhi(),
            time: lunar.getTimeInGanZhi(),
          },
          zodiac: lunar.getYearShengXiao(),
          constellation: solar.getXingZuo(),
          suitable: lunar.getDayYi(),       // 宜
          avoid: lunar.getDayJi(),           // 忌
          conflictZodiac: lunar.getDayChongShengXiao(), // 冲
          conflictDirection: lunar.getDayChongDesc(),    // 冲煞描述
          evilDirection: lunar.getDaySha(),  // 煞
          pengZu: {
            gan: lunar.getPengZuGan(),       // 彭祖百忌 (天干)
            zhi: lunar.getPengZuZhi(),       // 彭祖百忌 (地支)
          },
          luckyDirections: {
            xi: lunar.getDayPositionXiDesc(),        // 喜神方位
            yangGui: lunar.getDayPositionYangGuiDesc(), // 阳贵神方位
            yinGui: lunar.getDayPositionYinGuiDesc(),   // 阴贵神方位
            fu: lunar.getDayPositionFuDesc(),         // 福神方位
            cai: lunar.getDayPositionCaiDesc(),       // 财神方位
          },
          fetalGod: lunar.getDayPositionTai(),  // 胎神方位
          naYin: lunar.getDayNaYin(),           // 纳音
          solarTerm: lunar.getJieQi() || null,
          festivals: {
            lunar: lunar.getFestivals(),
            solar: solar.getFestivals(),
          },
          auspiciousGods: lunar.getDayJiShen(),   // 吉神宜趋
          inauspiciousGods: lunar.getDayXiongSha(), // 凶煞宜忌
          zhiXing: lunar.getZhiXing(),             // 值星 (建除十二值星)
          tianShen: {
            name: lunar.getDayTianShen(),         // 天神
            type: lunar.getDayTianShenType(),     // 类型
            luck: lunar.getDayTianShenLuck(),     // 吉凶
          },
        };

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message || String(e) }) }] };
      }
    }
  );
}
