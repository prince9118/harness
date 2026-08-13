import "dotenv/config";
import { askUser } from "./cli";
import { runHarness } from "./harness";
async function main() {
  const history: any[] = [];
  while (true) {
    const message = await askUser();

    if (message.trim() === "exit") {
      console.log("exit the loop");
      break;
    }

    const response = await runHarness(message, history);
    console.log("\nAssitant:", response);
  }
}

main();
