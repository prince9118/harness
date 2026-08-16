import fs from "node:fs/promises";
import type { Tool } from "./types";
import type path from "node:path";

export const editFileTool: Tool = {
  name: "edit_file",

  description: "Replace one exact piece of text in a file with new text",

  pathArgs: ["path"],

  requiresConfirmation: true,

  parameters: {
    type: "object",

    properties: {
      path: {
        type: "string",
        description: "path of the file to edit"
      },
      oldText: {
        type: "string",
        description: "exact text that should be replaced"
      },
      newText: {
        type: "string",
        description: "new text that should replae oldText"
      }
    },

    required: ["path", "oldText", "newText"],

    additionalProperties: false
  },
  async execute(args) {
    const path = args.path;
    const oldText = args.oldText;
    const newText = args.newText;

    if (
      typeof path !== "string" ||
      typeof oldText !== "string" ||
      typeof newText !== "string"
    ) {
      throw new Error("path, oldText and newText must be a string");
    }
    const content = await fs.readFile(path,"utf-8");
    const occurrences = content.split(oldText).length-1;
    if(occurrences === 0){
        throw new Error("Old Text was not found in the text");

    }
    if(occurrences>1){
        throw new Error(`OldText was found ${oldText} times.It must match exactly one.`)
    }
    const updateContent=content.replace(oldText,newText);

    await fs.writeFile(path,updateContent,"utf-8");
    return `Successfully edited ${path}`;

  }
};
