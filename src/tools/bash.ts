import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Tool } from "./types";

const execAsync = promisify(exec);

export const bashTool: Tool = {
  name: "bash",
  description: "Execute a shell command in the project directory",
  parameters: {
    type: "object",

    properties: {
      command: {
        type: "string"
      }
    },

    required: ["command"],

    additionalProperties: false
  },

  async execute(args) {
    const command = args.command;
    if (typeof command !== "string") {
      throw new Error("Command must be a string");
    }
    const { stdout, stderr } = await execAsync(command);
    return [
      stdout ? `STDOUT: \n${stdout}` : "",
      stderr ? `STDERR: \n${stderr} ` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }
};
