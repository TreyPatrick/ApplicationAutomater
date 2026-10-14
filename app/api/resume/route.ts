import { NextResponse } from "next/server";
import { anthropic, FAST_MODEL, extractJson, textOf } from "@/lib/claude";
import { guard, fail } from "@/lib/guard";
import { Resume } from "@/lib/schemas";

export const maxDuration = 60;

const PROMPT = `Extract this resume into JSON exactly matching this shape. Copy text faithfully; do not rewrite, add, or drop content.
{
  "name": string,
  "contact": string[],            // email, phone, LinkedIn, GitHub, city — each its own string
  "education": [{ "school": string, "location": string, "degree": string, "dates": string, "details": string[] }],  // details = GPA, minors, awards, coursework lines
  "sections": [{ "title": string, "entries": [{ "org": string, "location": string, "role": string, "dates": string, "bullets": string[] }] }],  // every other section in original order (Experience, Projects, Leadership...)
  "skills": string[]
}
Return only the JSON.`;

/** POST multipart form with field "file" (PDF). Parses and saves the resume. */
export async function POST(req: Request) {
  const g = await guard("ai");
  if ("error" in g) return g.error;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Attach a PDF." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Upload your resume as a PDF." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "PDF must be under 5 MB." }, { status: 400 });

    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const msg = await anthropic.messages.create({
      model: FAST_MODEL,
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
          { type: "text", text: PROMPT },
        ],
      }],
    });
    const resume = Resume.parse(extractJson(textOf(msg)));
    const { error } = await g.supabase.from("profiles").upsert({
      user_id: g.user.id, resume, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ resume });
  } catch (e) {
    return fail(e);
  }
}

/** PUT JSON { resume } — save user edits to the parsed resume (no AI cost). */
export async function PUT(req: Request) {
  const { supabaseServer } = await import("@/lib/supabase-server");
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const body = await req.json();
    const resume = Resume.parse(body.resume);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, resume, updated_at: new Date().toISOString() });
    if (error) throw error;
    return NextResponse.json({ resume });
  } catch (e) {
    return fail(e);
  }
}
