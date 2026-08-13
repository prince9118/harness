# Mini Harness

A small **LLM harness built from scratch using TypeScript and Bun** to
understand how AI coding agents and agent runtimes work internally.

The goal of this project is not to build a production-ready AI assistant,
but to learn the core building blocks behind an LLM agent:

- LLM communication
- Conversation management
- System prompts
- Tool calling
- Tool execution
- Agent loops
- Context management

---

When using an AI coding agent, it can feel like the model is directly interacting with your computer.

example:

```text
User
  ↓
"Create a TypeScript file"
  ↓
LLM
  ↓
Decides to use the write tool
  ↓
Harness
  ↓
Executes the tool
  ↓
Tool Result
  ↓
LLM
  ↓
Final Response
```

The **harness is the layer connecting the LLM with the environment and tools**.

This project is an attempt to build that layer from scratch and understand what is actually happening behind an AI agent.

---

## Tech Stack

- **TypeScript**
- **Bun**
- **OpenAI Responses API**
- **Commander.js**
- **dotenv **

---

## Project Structure

```text
mini-harness/
│
├── src/
│   ├── index.ts
│   ├── cli.ts
│   ├── harness.ts
│   ├── llm.ts
│   ├── types.ts
│   │
│   └── conversation/
│       └── conversation.ts
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

### Responsibilities

#### `cli.ts`

Handles the command-line interface and receives input from the user.

```text
User → CLI
```

#### `harness.ts`

Coordinates the interaction between the CLI, conversation, LLM, and tools.

```text
CLI
 ↓
Harness
 ↓
LLM
```

#### `llm.ts`

Responsible for communicating with the LLM API.

```text
Harness
   ↓
LLM Client
   ↓
OpenAI Responses API
```

#### `conversation/conversation.ts`

Maintains the conversation history.

```text
system
 ↓
user
 ↓
assistant
 ↓
user
 ↓
assistant
```

This allows the model to receive the relevant context from previous interactions.

#### `types.ts`

Contains TypeScript types and interfaces used throughout the harness.

---

# How a Harness Works

At a basic level, the harness maintains a loop between the user, the LLM, and the environment.

```text
                 ┌──────────┐
                 │   User   │
                 └────┬─────┘
                      ↓
                 ┌──────────┐
                 │   CLI    │
                 └────┬─────┘
                      ↓
                 ┌──────────┐
                 │ Harness  │
                 └────┬─────┘
                      ↓
                 ┌──────────┐
                 │   LLM    │
                 └────┬─────┘
                      ↓
                Tool decision
                      ↓
                 ┌──────────┐
                 │  Tools   │
                 └────┬─────┘
                      ↓
                 Tool result
                      ↓
                     LLM
                      ↓
                Final response
```
## Architecture

```text
User
 ↓
CLI
 ↓
Harness Loop
 ↓
LLM
 ↓
Tool Call?
 ├── No  → Final Answer
 │
 └── Yes
      ↓
    Tool
      ↓
   Result
      ↓
 Add to History
      ↓
    LLM again


The important idea is:

> The LLM decides what should happen, while the harness controls how it happens.

---

# Conversation Management

An LLM request is stateless from the perspective of your application unless you provide previous context.

The harness therefore maintains a conversation:

```text
[
  {
    role: "system",
    content: "You are a helpful coding assistant."
  },
  {
    role: "user",
    content: "Create a hello.ts file."
  },
  {
    role: "assistant",
    content: "..."
  }
]
```

The conversation can then be sent back to the model on subsequent requests.

This creates the illusion of a continuous conversation while the harness is actually maintaining the state.

---

# System Prompt

The harness can provide instructions to the model before the user interaction.

```text
system
  ↓
user
  ↓
assistant
```

The system prompt defines the model's behavior and can later contain instructions about:

- Available tools
- Tool usage
- File system rules
- Safety restrictions
- Coding behavior
- Environment information

---

# Tools

The next major part of the harness is **tool execution**.

A coding agent needs more than the ability to generate text.

It needs to interact with the environment.

The initial tools planned for this project are:

```text
read
write
bash
list
```

### Read

Read the contents of a file.

```text
read("src/index.ts")
```

### Write

Create or modify a file.

```text
write("src/test.ts", "console.log('hello')")
```

### Bash

Execute a shell command.

```text
bash("bun test")
```

### List

List files and directories.

```text
list(".")
```

---

# Agent Loop

Once tools are introduced, the harness becomes an agent runtime.

The basic loop looks like:

```text
User
 ↓
LLM
 ↓
Does the model need a tool?
 ├── No → Return response
 │
 └── Yes
       ↓
   Execute tool
       ↓
   Tool result
       ↓
   Add result to conversation
       ↓
   Call LLM again
       ↓
   Continue
```

Conceptually:

```text
while (!finished) {

    response = callLLM(conversation)

    if (response contains tool call) {

        result = executeTool(response)

        conversation.add(result)

    } else {

        return response
    }
}
```

This loop is one of the most important concepts in the project.

---

---

# Getting Started

## Prerequisites

Install:

- [Bun](https://bun.sh/)
- An OpenAI API key

---

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd mini-harness
```

Install dependencies:

```bash
bun install
```

---

## Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
```

Never commit your `.env` file.

Add it to `.gitignore`:

```text
.env
```

---

## Run the Project

```bash
bun run src/index.ts
```

Or, if using the configured script:

```bash
bun run dev
```

---

---

# Philosophy

This project is being built **from first principles**.

Instead of starting with an existing agent framework, the goal is to implement the fundamental pieces manually and understand what each abstraction actually does.

```text
LLM
 ↓
Conversation
 ↓
Tools
 ↓
Execution
 ↓
Agent Loop
 ↓
Harness
```
