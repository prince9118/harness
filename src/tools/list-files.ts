import { readdir } from "node:fs/promises";
import type { Tool } from "./types";

export const listFilesTool: Tool = {
  name: "list_files",
  description: "List files and  discription in a given directory",
  pathArgs: ["path"],

  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Directory path to list"
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

    const files = await readdir(path);
    return files.join("\n");
  }
};
