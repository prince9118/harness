import "dotenv/config";
import { askUser } from "./cli";
import { runHarness } from "./harness";
async function main() {
  while (true) {
    const message = await askUser();

    if (message.trim() === "exit") {
      console.log("exit the loop");
      break;
    }

    const response = await runHarness(message);
    console.log("\nAssitant:", response);
  }
}

main();
