#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

function parseArgs(): { dataDir: string } {
  const args = process.argv.slice(2);
  let dataDir: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--data-dir" && i + 1 < args.length) {
      dataDir = args[i + 1];
      i++;
    } else if (args[i]?.startsWith("--data-dir=")) {
      dataDir = args[i].split("=")[1];
    }
  }

  return {
    dataDir: dataDir || join(homedir(), ".mcp-chrono"),
  };
}

async function main(): Promise<void> {
  const { dataDir } = parseArgs();

  // Ensure data directory exists
  mkdirSync(dataDir, { recursive: true });

  const server = createServer(dataDir);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
