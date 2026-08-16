import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { listFilesTool } from "./list-files";
import { bashTool } from "./bash";
import { editFileTool } from "./edit-file";
import { grepTool } from "./grep";

export const tools = [
  readFileTool,
  writeFileTool,
  listFilesTool,
  bashTool,
  editFileTool,
  grepTool
];
