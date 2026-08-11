import type { Message } from "../types";
export class Conversation {
  private messages: Message[] = [];

  constructor(systemPrompt?: string) {
    if (systemPrompt) {
      this.messages.push({
        role: "system",
        content: systemPrompt,
      });
    }
  }

  addUserMessage(content: string) {
    this.messages.push({
      role: "user",
      content,
    });
  }

  addAssistantMessage(content: string) {
    this.messages.push({
      role: "assistant",
      content,
    });
  }

  getMessages(): Message[] {
    return [...this.messages];
  }
}
