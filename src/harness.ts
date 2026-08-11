import { Content } from "openai/resources/skills.mjs";
import { generateResponse } from "./llm";
import type { Message } from "./types";
import { Conversation } from "./conversation/conversation.ts";

const SYSTEM_PROMPT = `You are Mini Harness , helpful AI coding assistan.

you are running inside a CLI application .
be concise and explain technical concept clearly.`;

const conversation = new Conversation(SYSTEM_PROMPT);
// const messages: Message[] = [];

export async function runHarness(message: string): Promise<string> {
  conversation.addUserMessage(message);
  // messages.push({
  //   role: "user",
  //   content: message,
  // });

  const response = await generateResponse(conversation.getMessages());
  conversation.addAssistantMessage(response);

  // messages.push({
  //   role: "assistant",
  //   content: response,
  // });

  return response;
}
