import { writeFile } from "node:fs/promises";
import type { Tool } from "./types";

export const writeFileTool:Tool={
    name:"write_file",
    description:"Create or overwrite a file with the provided contet.",

    async execute(args){
        const path =args.path;
        const content= args.content;
        if(typeof path !== "string"){
            throw new Error("path must be a string");
        }
        if(typeof content !== "string"){
            throw new Error("content must be a string");
        }
        await writeFile(path, content,"utf-8");
        return `Successfully wrote ${path}`;
    }

}