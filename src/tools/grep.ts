import fs from "node:fs/promises";
import path from "node:path";
import type { Tool } from "./types";

const PROJECT_ROOT = process.cwd();

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

async function searchDirectory(
    directory:string,
    pattern:string,
    result:string[]
):promise<void>{
    
}
