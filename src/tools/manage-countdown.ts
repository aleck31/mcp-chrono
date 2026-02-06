import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { DateTime } from "luxon";

interface CountdownItem {
  id: string;
  name: string;
  targetDate: string;   // ISO 8601
  timezone: string;
  createdAt: string;
}

function getFilePath(dataDir: string): string {
  return join(dataDir, "countdown.json");
}

function loadCountdowns(dataDir: string): CountdownItem[] {
  const file = getFilePath(dataDir);
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as CountdownItem[];
  } catch {
    return [];
  }
}

function saveCountdowns(dataDir: string, items: CountdownItem[]): void {
  const file = getFilePath(dataDir);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(items, null, 2), "utf-8");
}

export function register(server: McpServer, dataDir: string): void {
  server.tool(
    "manage_countdown",
    "Manage persistent countdown timers. Supports CRUD operations: set (create), get (read one), list (read all), delete.",
    {
      action: z.enum(["set", "get", "list", "delete"]).describe("Action to perform"),
      id: z.string().optional().describe("Countdown ID (required for get/delete, auto-generated for set if not provided)"),
      name: z.string().optional().describe("Name/description for the countdown (required for set)"),
      target_date: z.string().optional().describe("Target date in ISO 8601 format (required for set)"),
      timezone: z.string().optional().describe("IANA timezone. Defaults to UTC."),
    },
    async ({ action, id, name, target_date, timezone }) => {
      const tz = timezone || "UTC";

      try {
        if (action === "set") {
          if (!name) return { content: [{ type: "text", text: JSON.stringify({ error: "name is required for set action" }) }] };
          if (!target_date) return { content: [{ type: "text", text: JSON.stringify({ error: "target_date is required for set action" }) }] };

          const targetDt = DateTime.fromISO(target_date, { zone: tz });
          if (!targetDt.isValid) {
            return { content: [{ type: "text", text: JSON.stringify({ error: `Invalid target_date: ${targetDt.invalidExplanation}` }) }] };
          }

          const items = loadCountdowns(dataDir);
          const newItem: CountdownItem = {
            id: id || `cd_${Date.now().toString(36)}`,
            name,
            targetDate: targetDt.toISO()!,
            timezone: tz,
            createdAt: DateTime.now().toISO()!,
          };

          // Replace if same ID exists
          const existingIdx = items.findIndex(i => i.id === newItem.id);
          if (existingIdx >= 0) {
            items[existingIdx] = newItem;
          } else {
            items.push(newItem);
          }
          saveCountdowns(dataDir, items);

          return { content: [{ type: "text", text: JSON.stringify({ success: true, item: newItem }, null, 2) }] };
        }

        if (action === "get") {
          if (!id) return { content: [{ type: "text", text: JSON.stringify({ error: "id is required for get action" }) }] };

          const items = loadCountdowns(dataDir);
          const item = items.find(i => i.id === id);
          if (!item) return { content: [{ type: "text", text: JSON.stringify({ error: `Countdown not found: ${id}` }) }] };

          const now = DateTime.now().setZone(item.timezone);
          const targetDt = DateTime.fromISO(item.targetDate, { zone: item.timezone });
          const isPast = targetDt < now;
          const [earlier, later] = isPast ? [targetDt, now] : [now, targetDt];
          const diff = later.diff(earlier, ["days", "hours", "minutes", "seconds"]);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                ...item,
                isPast,
                remaining: {
                  days: Math.floor(diff.days),
                  hours: Math.floor(diff.hours),
                  minutes: Math.floor(diff.minutes),
                  seconds: Math.floor(diff.seconds),
                },
                totalDays: Math.floor(diff.as("days")),
              }, null, 2),
            }],
          };
        }

        if (action === "list") {
          const items = loadCountdowns(dataDir);
          const now = DateTime.now();

          const enriched = items.map(item => {
            const targetDt = DateTime.fromISO(item.targetDate, { zone: item.timezone });
            const isPast = targetDt < now;
            const totalDays = Math.floor(Math.abs(targetDt.diff(now, "days").days));
            return { ...item, isPast, totalDays };
          });

          return { content: [{ type: "text", text: JSON.stringify({ count: enriched.length, items: enriched }, null, 2) }] };
        }

        if (action === "delete") {
          if (!id) return { content: [{ type: "text", text: JSON.stringify({ error: "id is required for delete action" }) }] };

          const items = loadCountdowns(dataDir);
          const idx = items.findIndex(i => i.id === id);
          if (idx < 0) return { content: [{ type: "text", text: JSON.stringify({ error: `Countdown not found: ${id}` }) }] };

          const removed = items.splice(idx, 1)[0];
          saveCountdowns(dataDir, items);

          return { content: [{ type: "text", text: JSON.stringify({ success: true, deleted: removed }, null, 2) }] };
        }

        return { content: [{ type: "text", text: JSON.stringify({ error: `Unknown action: ${action}` }) }] };
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message || String(e) }) }] };
      }
    }
  );
}
