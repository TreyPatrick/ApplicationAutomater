import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, MODEL, extractJson, textOf } from "@/lib/claude";
import { guard, fail } from "@/lib/guard";
import { JobHit } from "@/lib/schemas";

export const maxDuration = 120;

const Body = z.object({
  roles: z.string().min(2).max(200),
  cities: z.string().min(2).max(200),
  level: z.string().max(100).default("full-time, new grad"),
  extra: z.string().max(300).default(""),
});

/** POST { roles, cities, level, extra } — live web search for open postings. */
export async function POST(req: Request) {
  const g = await guard("search");
  if ("error" in g) return g.error;
  try {
    const b = Body.parse(await req.json());
    const { data: profile } = await g.supabase.from("profiles").select("resume").eq("user_id", g.user.id).maybeSingle();
    const today = new Date().toISOString().slice(0, 10);

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      tools: [{ type: "web_search_20260318", name: "web_search", max_uses: 6, allowed_callers: ["direct"] }],
      messages: [{
        role: "user",
        content: `Today is ${today}. Find currently OPEN job postings for this candidate.
Roles: ${b.roles}
Cities: ${b.cities}
Level: ${b.level}
${b.extra ? `Notes: ${b.extra}` : ""}
${profile?.resume ? `Candidate resume (JSON, for fit only): ${JSON.stringify(profile.resume).slice(0, 6000)}` : ""}

Prefer employer career pages and applicant tracking systems (Workday, Greenhouse, Lever, Handshake, iCIMS) over aggregators. Check deadlines; mark postings whose deadline has passed as "closed". Note eligibility blockers (clearance, years of experience, graduation window, citizenship) in "why".
Return 6-12 results as a JSON array only:
[{"company": "", "title": "", "location": "", "url": "", "deadline": "", "status": "open|closing_soon|closed|unknown", "why": "one sentence on fit or blockers"}]`,
      }],
    });

    const jobs = z.array(JobHit).parse(extractJson(textOf(msg)));
    // Collect cited sources so the UI can show where results came from.
    const sources = new Map<string, string>();
    for (const block of msg.content) {
      if (block.type === "text" && block.citations) {
        for (const c of block.citations) {
          if (c.type === "web_search_result_location") sources.set(c.url, c.title ?? c.url);
        }
      }
    }
    return NextResponse.json({ jobs, sources: [...sources].map(([url, title]) => ({ url, title })) });
  } catch (e) {
    return fail(e);
  }
}
