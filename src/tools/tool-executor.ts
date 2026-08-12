import { tools } from "./registry";

export class ToolExecutor {
  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = tools.find((tool) => tool.name === name);
    if (!tool) {
      throw new Error(`Unknown tool : ${name}`);
    }
    try {
      return await tool.execute(args);
    } catch (error) {
      if (error instanceof Error) {
        console.log("Tool failed:", error.message);
      } else {
        console.log("Tool failed:", error);
      }
      return "Tool failed with an unknown error.";
    }
  }
}
