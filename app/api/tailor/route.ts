import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, MODEL, extractJson, textOf, HONESTY_RULES } from "@/lib/claude";
import { guard, fail } from "@/lib/guard";
import { Resume } from "@/lib/schemas";

export const maxDuration = 90;

const Body = z.object({
  job: z.string().min(30, "Paste the job description (at least a few sentences).").max(20000),
});

/** POST { job } — returns a tailored copy of the saved resume plus a list of what changed. */
export async function POST(req: Request) {
  const g = await guard("ai");
  if ("error" in g) return g.error;
  try {
    const { job } = Body.parse(await req.json());
    const { data: profile } = await g.supabase.from("profiles").select("resume").eq("user_id", g.user.id).maybeSingle();
    if (!profile?.resume) return NextResponse.json({ error: "Upload your resume first." }, { status: 400 });

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      system: `You tailor resumes for students and new grads so they fit one page and match a specific job.\n${HONESTY_RULES}`,
      messages: [{
        role: "user",
        content: `RESUME (JSON):\n${JSON.stringify(profile.resume)}\n\nJOB DESCRIPTION:\n${job}\n
Return JSON only: {"resume": <same shape as input>, "changes": string[] (short notes on what you reordered/reworded and why), "gaps": string[] (requirements the candidate doesn't show — for them to address honestly, never added to the resume)}.
Keep it to roughly one page: at most ~5 bullets per entry, drop the least relevant content first.`,
      }],
    });
    const out = extractJson<{ resume: unknown; changes?: string[]; gaps?: string[] }>(textOf(msg));
    return NextResponse.json({
      resume: Resume.parse(out.resume),
      changes: out.changes ?? [],
      gaps: out.gaps ?? [],
    });
  } catch (e) {
    return fail(e);
  }
}
