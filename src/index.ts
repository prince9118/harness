import "dotenv/config";
import { askUser } from "./cli";
import { runHarness } from "./harness";

async function main() {
  const history: any[] = [];
  let summary="";

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
      summary="";
      console.log("Conversation cleared.");
      continue;
    }

    const result = await runHarness(message, history, summary);
    summary=result.summary;

    console.log("\nAssistant:", result.response);
  }
}

main();
