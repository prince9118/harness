export type Tool = {
  name: string;
  description: string;

  parameters:{
    type:"object";
    properties:Record<string,unknown>;
    required:string[];
    additionalProperties:boolean;
  }

  execute: (args: Record<string, unknown>) => Promise<string>;
};
