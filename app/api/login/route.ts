import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";

/** POST { email } — sends a magic sign-in link, optionally restricted to allowed email domains. */
export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().email() }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.some((d) => email.endsWith("@" + d))) {
    return NextResponse.json({ error: `Use your ${allowed.join(" or ")} email.` }, { status: 403 });
  }

  const origin = new URL(req.url).origin;
  const { error } = await supabaseServer().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
