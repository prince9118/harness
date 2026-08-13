import { readFile } from "node:fs/promises";
import type { Tool } from "./types.js";

export const readFileTool: Tool = {
  name: "read_file",

  description: "Read the contents of a file.",
  pathArgs: ["path"],

  parameters: {
    type: "object",

    properties: {
      path: {
        type: "string",
        description: "Path of the file to read"
      }
    },

    required: ["path"],

    additionalProperties: false
  },

  async execute(args) {
    const path = args.path;

    if (typeof path !== "string") {
      throw new Error("path must be a string");
    }

    return await readFile(path, "utf-8");
  }
};
