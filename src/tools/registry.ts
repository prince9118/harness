import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { listFilesTool } from "./list-files";
import { bashTool } from "./bash";

export const tools = [readFileTool, writeFileTool, listFilesTool, bashTool];
