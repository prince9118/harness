import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Tool } from "./types";

const execAsync = promisify(exec);

const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 200_000;

function truncate(text: string): string {
  if (text.length <= MAX_OUTPUT_BYTES) return text;
  const cut = text.length - MAX_OUTPUT_BYTES;
  return text.slice(0, MAX_OUTPUT_BYTES) + `\n...[truncate,${cut} more bytes]`;
}

export const bashTool: Tool = {
  name: "bash",
  description: "Execute a shell command in the project directory",
  requiresConfirmation: true,
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
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES
      });
      return [
        stdout ? `STDOUT: \n${stdout}` : "",
        stderr ? `STDERR: \n${stderr} ` : ""
      ]
        .filter(Boolean)
        .join("\n");
    } catch (error: any) {
      if (error.killed && error.signal) {
        return `Command timed out after ${TIMEOUT_MS / 1000}s and was killed`;
      }
      if (/maxBuffer/i.test(error.message ?? "")) {
        return `Command produced too much output (> ${MAX_OUTPUT_BYTES} bytes) and was cut off.`;
      }
      const stdout = error.stdout ? `STDOUT:\n${truncate(error.stdout)}` : "";
      const stderr = error.stderr ? `STDERR:\n${truncate(error.stderr)}` : "";
      return [stdout, stderr, `Command failed: ${error.message}`]
        .filter(Boolean)
        .join("\n");
    }
  }
};
