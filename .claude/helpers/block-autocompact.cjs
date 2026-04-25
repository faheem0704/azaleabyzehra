#!/usr/bin/env node
/**
 * Block auto-compaction so context is never silently lost.
 * PreCompact hook with matcher "auto" must exit 2 to prevent Claude Code
 * from compacting automatically. Manual /compact is still allowed (different matcher).
 */
const path = require("path");
const fs = require("fs");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const logDir = path.join(projectDir, ".claude-flow", "logs");

try {
  fs.mkdirSync(logDir, { recursive: true });
  const ts = new Date().toISOString();
  fs.appendFileSync(
    path.join(logDir, "autocompact-blocked.log"),
    `${ts} Auto-compaction blocked. Use /compact to compact manually.\n`
  );
} catch (_) {
  // Non-fatal — blocking still works regardless
}

process.stderr.write(
  "Auto-compaction blocked by RuFlo Context Autopilot. Use /compact to compact manually.\n"
);

// Exit code 2 = tell Claude Code to block this compaction
process.exit(2);
