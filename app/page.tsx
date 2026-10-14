"use client";
import { useState } from "react";

const name = process.env.NEXT_PUBLIC_APP_NAME || "OfferDesk";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setState("sending");
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || "Couldn't send the link."); setState("idle"); return; }
    setState("sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-12 px-4 py-16 md:flex-row md:items-center">
      <section className="flex-1 space-y-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">{name}</p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Apply smarter, not 200 times.</h1>
        <p className="max-w-lg text-lg text-ink/70">
          Upload your resume once. Find roles that are actually still open, get a tailored resume and cover
          letter for each one, and keep every application in one tracker.
        </p>
        <ul className="space-y-2 text-sm text-ink/80">
          <li>• Live search of employer career pages, with deadlines checked</li>
          <li>• Tailoring that only uses what’s really on your resume</li>
          <li>• Cover letters, application answers, and networking notes</li>
        </ul>
      </section>
      <section className="card w-full max-w-sm">
        {state === "sent" ? (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-ink/70">We sent a sign-in link to {email}. Open it on this device.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-lg font-semibold">Sign in</h2>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
            </div>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <button className="btn w-full" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a sign-in link"}</button>
            <p className="text-xs text-ink/50">No password. You submit every application yourself.</p>
          </form>
        )}
      </section>
    </main>
  );
}
