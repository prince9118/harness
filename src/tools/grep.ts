import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types";

const PROJECT_ROOT = process.cwd();

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

async function searchDirectory(
  directory: string,
  pattern: string,
  results: string[]
): promise<void> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true
  });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) {
        continue;
      }

      await searchDirectory(fullPath, pattern, results);
      continue;
    }

    if(!entry.isFile()){
        continue;
    }
    try{
        const content= await fs.readFile(
            fullPath,
            "utf-8"
        );
        const lines= content.split("\n");
        for(let i=0;i<lines.length;i++){
            if(lines[i]?.includes(pattern)){
                const relativePath=path.relative(PROJECT_ROOT,fullPath);
                results.push(
                    `${relativePath}: ${i+1}: ${lines[i]?.trim()}`
                );
            }
        }

    }
    catch{
        // ignore the files that connot be read as text.
    }
  }
}
