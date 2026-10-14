import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
export const FAST_MODEL = process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-5-5";

/** Concatenate the text blocks of a response. */
export function textOf(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Pull the first JSON object/array out of model text (handles ```json fences). */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found in model output");
  const open = raw[start];
  const close = open === "{" ? "}" : "]";
  const end = raw.lastIndexOf(close);
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

export const HONESTY_RULES = `Rules you must follow:
- Use ONLY facts present in the candidate's resume. Never invent jobs, titles, dates, employers, metrics, numbers, tools, certifications, or outcomes.
- You may reorder, reword, condense, and emphasize existing content to match the job.
- If the job asks for something the candidate doesn't have, leave it out — do not imply it.`;
