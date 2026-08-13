import { tools } from "./registry.js";

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
