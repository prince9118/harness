import type { ResponseInputItem } from "openai/resources/responses/responses";

/**
 * What actually flows through `history` / the Responses API `input` array
 * at runtime: plain {role, content} messages, but also raw items straight
 * out of `response.output` -- function_call, function_call_output, and
 * whatever else the Responses API emits. `ResponseInputItem` is the SDK's
 * own union for "things you can feed back in as input", which is exactly
 * this shape (it includes the output-item variants like function calls and
 * assistant messages), so it's a truer fit than a hand-rolled
 * {role, content} type ever was.
 */
export type Message = ResponseInputItem;
