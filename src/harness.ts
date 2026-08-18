import fs from "node:fs/promises";
import { generateResponse } from "./llm.js";
import { ToolExecutor } from "./tools/tool-executor.js";
import pc from "picocolors";
import type { Message } from "./types.js";
// const SYSTEM_PROMPT = `
// You are Mini Harness, a coding agent running in a terminal.

// You have access to tools that allow you to interact with the user's
// workspace.

// IMPORTANT:
// - Use tools whenever the user's request requires interacting with
//   files, directories, or the shell.
// - Never claim you performed an action unless a tool actually performed it.
// - If the user asks about files, inspect the filesystem using a tool.
// - If the user asks you to create or modify a file, use write_file.
// - If the user asks you to run a command, use bash.
// `;

const toolExecutor = new ToolExecutor();

// context management

const MAX_MESSAGES = 20;
const RECENT_MESSAGES = 10;

async function summarizeMessages(
  previousSummary: string,
  messages: Message[]
): Promise<string> {
  const prompt = `
  You maintain a compact memory of a conversation.

  Update the existing memory using the new conversation messages.

  Keep important information such as:
  - user's goals
  - project information
  - important decisions
  - constraints
  - completed work
  - current task
  - important technical details
  - things needed to continue the conversation

  Remove unnecessary conversation and repetition.

  Existing memory:
  ${previousSummary || "(none)"}

  New conversation messages:
  ${JSON.stringify(messages, null, 2)}

  Return ONLY the updated memory.
  `;

  const response = await generateResponse(
    [
      {
        role: "user",
        content: prompt
      }
    ],
    "You maintain concise long-term memory for an AI coding agent."
  );

  return response.output_text;
}

async function buildSystemPrompt(): Promise<string> {
  const projectRoot = process.cwd();

  const operatingSystem =
    process.platform === "win32"
      ? "Windows"
      : process.platform === "darwin"
        ? "macOS"
        : "Linux";

  const entries = await fs.readdir(projectRoot, {
    withFileTypes: true
  });

  const files = entries
    .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
    .join("\n");

  return `
  You are Mini Harness, a coding agent running in a terminal.

  You have access to tools that allow you to interact with
  the user's workspace.

  IMPORTANT:
  - Use tools whenever the user's request requires interacting
    with files, directories, or the shell.
  - Never claim you performed an action unless a tool actually
    performed it.
  - If the user asks about files, inspect the filesystem using a tool.
  - If the user asks you to create or modify a file, use write_file
    or edit_file.
  - If the user asks you to run a command, use bash.

  ENVIRONMENT:

  Project directory:
  ${projectRoot}

  Operating system:
  ${operatingSystem}

  Top-level files and directories:
  ${files}
  `;
}

export async function runHarness(
  message: string,
  history: Message[],
  summary: string
): Promise<{
  response: string;
  summary: string;
}> {
  history.push({
    role: "user",
    content: message
  });

  if (history.length > MAX_MESSAGES) {
    const oldMessages = history.slice(0, -RECENT_MESSAGES);
    const recentMessage = history.slice(-RECENT_MESSAGES);
    // console.log("Old Message:", oldMessages);
    // console.log("Recent Messages:", recentMessage);

    summary = await summarizeMessages(summary, oldMessages);
    history.length = 0;
    history.push(...recentMessage);
  }

  const systemPrompt = await buildSystemPrompt();

  // let input = history;
  let input: Message[] = [
    ...(summary
      ? ([
          {
            role: "user",
            content: `Conversation memory:\n${summary}`
          }
        ] satisfies Message[])
      : []),
    ...history
  ];

  const MAX_ITERATIONS = 25;
  let iterations = 0;

  while (true) {
    if (++iterations > MAX_ITERATIONS) {
      throw new Error(
        `Tool loop exceeded ${MAX_ITERATIONS} iterations -- stopping.`
      );
    }

    const response = await generateResponse(input, systemPrompt);

    // The Responses API's own types allow response.output (ResponseOutputItem[])
    // to be fed straight back in as the next call's input, which is exactly
    // what we do below -- the two unions just disagree on one unused corner
    // (computer-tool-call "failed" status), so we assert instead of widening
    // Message back to `any`.
    const outputItems = response.output as unknown as Message[];

    const toolCalls = response.output.filter(
      (item) => item.type === "function_call"
    );

    if (toolCalls.length === 0) {
      // save the assistant's final reply so it's remembered next turn.
      // (index.ts prints this via the returned `response` field, so don't
      // print it here too -- that would double it up.)
      input.push(...outputItems);
      history.push(...outputItems);

      return {
        response: response.output_text,
        summary
      };
    }

    // The model narrated something before/between tool calls on this turn.
    // It won't appear in the final answer, so print it now or it's lost.
    if (response.output_text) {
      console.log(pc.blue(`\nAssistant:${response.output_text}`));
    }

    // Preserve the model's output items.
    input.push(...outputItems);

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.arguments);
      console.log(pc.yellow(`\n [tool] ${toolCall.name}`));
      const result = await toolExecutor.execute(toolCall.name, args);

      console.log(pc.blue(`[tool result]\n${result}`));

      input.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: result
      });
    }
  }
}
