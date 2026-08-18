import "dotenv/config";
import pc from "picocolors";
import { askUser } from "./cli";
import { runHarness } from "./harness";
import type { Message } from "./types.js";

async function main() {
  const history: Message[] = [];
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

    try {
      const result = await runHarness(message, history, summary);
      summary = result.summary;

      console.log("\nAssistant:", result.response);
    } catch (error) {
      // An API error, a network blip, or hitting MAX_ITERATIONS throws out
      // of runHarness. Without this, that exception is uncaught here and
      // kills the whole process -- taking the conversation history with it.
      // Report it and keep the loop (and history) alive instead.
      const messageText = error instanceof Error ? error.message : String(error);
      console.log(pc.red(`\n[error] ${messageText}`));
    }
  }
}

main();
