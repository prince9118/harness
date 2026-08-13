import { tools } from "./registry.js";
import path from "node:path";
import inquirer from "inquirer";

  const PROJECT_ROOT = process.cwd();

function assertSafePath(rawPath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, rawPath);
  const rootWithSep = PROJECT_ROOT.endsWith(path.sep)
    ? PROJECT_ROOT  
    : PROJECT_ROOT + path.sep;

  return "";
}

export class ToolExecutor {
  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = tools.find((tool) => tool.name === name);

    if (!tool) {
      return `Tool '${name}' does not exist.`;
    }

    try {
      return await tool.execute(args);
    } catch (error) {
      if (error instanceof Error) {
        return `Tool error: ${error.message}`;
      }

      return "Tool failed with an unknown error.";
    }
  }
}
