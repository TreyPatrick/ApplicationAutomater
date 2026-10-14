"use client";
import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { ResumeT, JobHitT } from "@/lib/schemas";
import ResumeTab from "@/components/ResumeTab";
import SearchTab from "@/components/SearchTab";
import TailorTab from "@/components/TailorTab";
import TrackerTab, { type Job } from "@/components/TrackerTab";

const TABS = ["Resume", "Find jobs", "Tailor & write", "Tracker"] as const;
type Tab = (typeof TABS)[number];
const name = process.env.NEXT_PUBLIC_APP_NAME || "OfferDesk";

export default function AppHome() {
  const sb = supabaseBrowser();
  const [tab, setTab] = useState<Tab>("Resume");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<ResumeT | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  const loadJobs = useCallback(async () => {
    const { data } = await sb.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs((data as Job[]) ?? []);
  }, [sb]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { window.location.href = "/"; return; }
      setEmail(user.email ?? "");
      const { data } = await sb.from("profiles").select("resume").eq("user_id", user.id).maybeSingle();
      if (data?.resume) { setResume(data.resume as ResumeT); setTab("Find jobs"); }
      loadJobs();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveHit(j: JobHitT) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("jobs").insert({ user_id: user.id, company: j.company, title: j.title, location: j.location, url: j.url, deadline: j.deadline, notes: j.why });
    loadJobs();
  }
  async function addJob(j: { company: string; title: string }) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("jobs").insert({ user_id: user.id, ...j });
    loadJobs();
  }
  async function updateJob(id: string, patch: Partial<Job>) {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    await sb.from("jobs").update(patch).eq("id", id);
  }
  async function deleteJob(id: string) {
    setJobs((js) => js.filter((j) => j.id !== id));
    await sb.from("jobs").delete().eq("id", id);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold text-brand">{name}</p>
        <div className="flex items-center gap-3 text-sm text-ink/60">
          <span>{email}</span>
          <button className="btn-ghost" onClick={async () => { await sb.auth.signOut(); window.location.href = "/"; }}>Sign out</button>
        </div>
      </header>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? "border-brand text-brand" : "border-transparent text-ink/60 hover:text-ink"}`}>
            {t}{t === "Tracker" && jobs.length > 0 ? ` (${jobs.length})` : ""}
          </button>
        ))}
      </nav>
      {tab === "Resume" && <ResumeTab resume={resume} onChange={(r) => { setResume(r); }} />}
      {tab === "Find jobs" && <SearchTab onSave={saveHit} />}
      {tab === "Tailor & write" && <TailorTab hasResume={!!resume} />}
      {tab === "Tracker" && <TrackerTab jobs={jobs} onUpdate={updateJob} onDelete={deleteJob} onAdd={addJob} />}
    </main>
  );
}
