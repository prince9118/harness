import OpenAI from "openai";
import type { Message } from "./types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(message: Message[]): Promise<string> {
  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: message,
  });
  return response.output_text;
}
