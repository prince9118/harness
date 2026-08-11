import path from "node:path";
import type { Tool } from "./types.ts";
import { readFile } from "node:fs/promises";

export const readFileTool: Tool = {
  name: "read_file",
  description: "Read the content of a file",
  async execute(args) {
    const path = args.path;

    if (typeof path !== "string") {
      throw new Error("paht must be a string ");
    }
    return await readFile(path, "utf-8");
  }
};
