import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types.js";

const PROJECT_ROOT = process.cwd();

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

async function searchDirectory(
  directory: string,
  pattern: string,
  results: string[]
): Promise<void> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) {
        continue;
      }

      await searchDirectory(fullPath, pattern, results);

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    try {
      const content = await fs.readFile(fullPath, "utf8");

      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.includes(pattern)) {
          const relativePath = path.relative(PROJECT_ROOT, fullPath);

          results.push(`${relativePath}:${i + 1}: ${lines[i]?.trim()}`);
        }
      }
    } catch {
      // Ignore files that cannot be read as text.
    }
  }
}

export const grepTool: Tool = {
  name: "grep",

  description: "Search file contents across the project for a text string.",

  parameters: {
    type: "object",

    properties: {
      pattern: {
        type: "string",
        description: "Text to search for inside project files."
      }
    },

    required: ["pattern"],

    additionalProperties: false
  },

  async execute(args) {
    const pattern = args.pattern;

    if (typeof pattern !== "string") {
      throw new Error("pattern must be a string");
    }

    if (pattern.length === 0) {
      throw new Error("pattern cannot be empty");
    }

    const results: string[] = [];

    await searchDirectory(PROJECT_ROOT, pattern, results);

    if (results.length === 0) {
      return `No matches found for "${pattern}".`;
    }

    return results.join("\n");
  }
};
