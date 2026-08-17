import fs from "node:fs";
console.log("OS" + process.platform);
console.log("directory" + process.cwd());
console.log(fs.readdirSync(process.cwd()));
