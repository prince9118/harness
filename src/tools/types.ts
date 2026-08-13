export type Tool = {
  name: string;
  description: string;

  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: boolean;
  };

  /** Names of args (in `execute`'s args object) that are filesystem paths.
   *  The executor will resolve + sandbox-check these before calling execute. */
  pathArgs?: string[];

  /** If true, the executor asks the user to confirm before running this tool. */
  requiresConfirmation?: boolean;

  execute: (args: Record<string, unknown>) => Promise<string>;
};
