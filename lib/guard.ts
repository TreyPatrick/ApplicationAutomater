import { NextResponse } from "next/server";
import { supabaseServer } from "./supabase-server";

type Kind = "ai" | "search";

/** Ensures a signed-in user and spends one unit of their daily quota. */
export async function guard(kind: Kind = "ai") {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) } as const;
  }
  const limit = Number(
    kind === "search" ? process.env.DAILY_SEARCH_LIMIT || 5 : process.env.DAILY_AI_LIMIT || 25
  );
  const { data: allowed, error } = await supabase.rpc("consume_quota", { p_kind: kind, p_limit: limit });
  if (error) {
    return { error: NextResponse.json({ error: "Usage check failed. Try again." }, { status: 500 }) } as const;
  }
  if (!allowed) {
    const what = kind === "search" ? "job searches" : "AI actions";
    return {
      error: NextResponse.json(
        { error: `You've used today's ${limit} ${what}. It resets at midnight.` },
        { status: 429 }
      ),
    } as const;
  }
  return { supabase, user } as const;
}

export function fail(e: unknown) {
  console.error(e);
  const msg = e instanceof Error ? e.message : "Something went wrong.";
  return NextResponse.json({ error: msg }, { status: 500 });
}
