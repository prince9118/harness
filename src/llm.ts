import OpenAI from "openai";
import type { Message } from "./types.js";
import { tools } from "./tools/registry.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const toolDefinitions = tools.map((tool) => ({
  type: "function" as const,
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters,
  strict: true
}));

export async function generateResponse(input: Message[], instructions: string) {
  return await client.responses.create({
    model: "gpt-5",
    instructions,
    input,
    tools: toolDefinitions
  });
}
