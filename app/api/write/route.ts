import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, MODEL, textOf, HONESTY_RULES } from "@/lib/claude";
import { guard, fail } from "@/lib/guard";

export const maxDuration = 90;

const Body = z.object({
  kind: z.enum(["cover_letter", "answer", "outreach"]),
  job: z.string().max(20000).default(""),
  question: z.string().max(2000).default(""),
  company: z.string().max(200).default(""),
  tone: z.string().max(100).default("confident, specific, plain-spoken"),
});

const TASKS = {
  cover_letter: (b: z.infer<typeof Body>) =>
    `Write a one-page cover letter (3-4 short paragraphs, under 350 words) for this job${b.company ? ` at ${b.company}` : ""}. Open with the role, connect 2-3 concrete experiences from the resume to the job, close briefly. No clichés like "I am writing to express". Sign with the candidate's name.\n\nJOB:\n${b.job}`,
  answer: (b: z.infer<typeof Body>) =>
    `Draft an answer to this application question in the candidate's voice. Match any length limit in the question; otherwise 120-200 words. Be specific and grounded in the resume.\n\nQUESTION:\n${b.question}\n\n${b.job ? `JOB CONTEXT:\n${b.job}` : ""}`,
  outreach: (b: z.infer<typeof Body>) =>
    `Write a short LinkedIn/email message (under 90 words) asking someone at ${b.company || "the company"} for a 15-minute chat about the role, mentioning one specific shared or relevant point from the resume. Friendly, not pushy.\n\n${b.job ? `ROLE CONTEXT:\n${b.job}` : ""}`,
};

/** POST { kind, job?, question?, company?, tone? } — cover letters, application answers, outreach notes. */
export async function POST(req: Request) {
  const g = await guard("ai");
  if ("error" in g) return g.error;
  try {
    const b = Body.parse(await req.json());
    const { data: profile } = await g.supabase.from("profiles").select("resume").eq("user_id", g.user.id).maybeSingle();
    if (!profile?.resume) return NextResponse.json({ error: "Upload your resume first." }, { status: 400 });

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: `You write job-application materials for a student or new grad. Tone: ${b.tone}.\n${HONESTY_RULES}\nOutput only the finished text, no preamble.`,
      messages: [{ role: "user", content: `RESUME (JSON):\n${JSON.stringify(profile.resume)}\n\n${TASKS[b.kind](b)}` }],
    });
    return NextResponse.json({ text: textOf(msg).trim() });
  } catch (e) {
    return fail(e);
  }
}
