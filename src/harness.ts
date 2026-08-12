import { generateResponse } from "./llm.js";
import { ToolExecutor } from "./tools/tool-executor.js";

const SYSTEM_PROMPT = `
You are Mini Harness, a coding agent running in a terminal.

You have access to tools that allow you to interact with the user's
workspace.

IMPORTANT:
- Use tools whenever the user's request requires interacting with
  files, directories, or the shell.
- Never claim you performed an action unless a tool actually performed it.
- If the user asks about files, inspect the filesystem using a tool.
- If the user asks you to create or modify a file, use write_file.
- If the user asks you to run a command, use bash.
`;

const toolExecutor = new ToolExecutor();

export async function runHarness(message: string): Promise<string> {
  let input: any[] = [
    {
      role: "user",
      content: message
    }
  ];

  while (true) {
    const response = await generateResponse(input, SYSTEM_PROMPT);

    const toolCalls = response.output.filter(
      (item) => item.type === "function_call"
    );

    if (toolCalls.length === 0) {
      return response.output_text;
    }

    // Preserve the model's output items.
    input.push(...response.output);

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.arguments);
      console.log(`\n [tool] ${toolCall.name}`);
      const result = await toolExecutor.execute(toolCall.name, args);

      console.log(`[tool result]\n${result}`);

      input.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: result
      });
    }
  }
}
