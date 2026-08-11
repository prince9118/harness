import { readdir } from "node:fs/promises";
import type { Tool } from "./types";

export const listFilesTool: Tool = {
  name: "list_files",
  description: "List files and  discription in a given directory",

  async execute(args) {
    const path = args.path;

    if (typeof path !== "string") {
      throw new Error("path must be a string");
    }

    const files = await readdir(path);
    return files.join("\n");
  }
};
