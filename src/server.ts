import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { register as registerCurrentTime } from "./tools/current-time.js";
import { register as registerCalendarConvert } from "./tools/calendar-convert.js";
import { register as registerTimezone } from "./tools/timezone.js";
import { register as registerDateCalc } from "./tools/date-calc.js";
import { register as registerDateDiff } from "./tools/date-diff.js";
import { register as registerParseTimestamp } from "./tools/parse-timestamp.js";
import { register as registerFestivals } from "./tools/festivals.js";
import { register as registerMonthInfo } from "./tools/month-info.js";
import { register as registerCountdown } from "./tools/countdown.js";
import { register as registerBusinessDays } from "./tools/business-days.js";
import { register as registerAlmanac } from "./tools/almanac.js";
import { register as registerManageCountdown } from "./tools/manage-countdown.js";

export function createServer(dataDir: string): McpServer {
  const server = new McpServer({
    name: "mcp-chrono",
    version: "1.0.0",
  });

  // P0 — Core tools
  registerCurrentTime(server);
  registerCalendarConvert(server);
  registerTimezone(server);
  registerDateCalc(server);
  registerDateDiff(server);
  registerParseTimestamp(server);
  registerFestivals(server, dataDir);

  // P1 — High priority
  registerMonthInfo(server);
  registerCountdown(server);
  registerBusinessDays(server, dataDir);

  // P2 — Nice-to-have
  registerAlmanac(server);
  registerManageCountdown(server, dataDir);

  return server;
}
