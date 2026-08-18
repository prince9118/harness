import { tools } from "./registry.js";
import path from "node:path";
import inquirer from "inquirer";

const PROJECT_ROOT = process.cwd();

function assertSafePath(rawPath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, rawPath);
  const rootWithSep = PROJECT_ROOT.endsWith(path.sep)
    ? PROJECT_ROOT
    : PROJECT_ROOT + path.sep;
  if (resolved !== PROJECT_ROOT && !resolved.startsWith(rootWithSep)) {
    throw new Error(`path "${rawPath} is outside of the project folder.`);
  }

  return resolved;
}

async function confirmAction(
  toolName: string,
  args: Record<string, unknown>
): Promise<boolean> {
  console.log(`\n[confirm] About to run "${toolName}":`);
  console.log(JSON.stringify(args, null, 2));
  const { proceed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "proceed",
      message: "Allow this action?",
      default: false
    }
  ]);

  return proceed;
}

export class ToolExecutor {
  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = tools.find((tool) => tool.name === name);

    if (!tool) {
      return `Tool '${name}' does not exist.`;
    }

    try {
      // Sandbox: resolve + validate every arg this tool declared as a path.
      const safeArgs = { ...args };
      for (const key of tool.pathArgs ?? []) {
        const value = safeArgs[key];
        if (typeof value === "string") {
          safeArgs[key] = assertSafePath(value);
        }
      }

      // Ask first, for anything that can change/run something.
      if (tool.requiresConfirmation) {
        const ok = await confirmAction(name, safeArgs);
        if (!ok) {
          return `Skipped: user declined to run '${name}'.`;
        }
      }
      return await tool.execute(safeArgs);
    } catch (error) {
      if (error instanceof Error) {
        return `Tool error: ${error.message}`;
      }

      return "Tool failed with an unknown error.";
    }
  }
}
