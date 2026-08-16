import "dotenv/config";
import { askUser } from "./cli";
import { runHarness } from "./harness";

async function main() {
  const history: any[] = [];

  while (true) {
    const message = await askUser();
    const command = message.trim();

    if (command === "/exit") {
      console.log("Goodbye!");
      break;
    }

    if (command === "/help") {
      console.log(`
        Available commands:

        /help   Show available commands
        /clear  Clear conversation history
        /exit   Exit the Harness
        `);
      continue;
    }

    if (command === "/clear") {
      history.length = 0;
      console.log("Conversation cleared.");
      continue;
    }

    const response = await runHarness(message, history);

    console.log("\nAssistant:", response);
  }
}

main();
