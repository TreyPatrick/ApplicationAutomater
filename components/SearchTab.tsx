"use client";
import { useState } from "react";
import type { JobHitT } from "@/lib/schemas";
import { api } from "./api";

const STATUS: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-800",
  closing_soon: "bg-amber-50 text-amber-800",
  closed: "bg-red-50 text-red-800",
  unknown: "bg-gray-100 text-gray-700",
};

export default function SearchTab({ onSave }: { onSave: (j: JobHitT) => Promise<void> }) {
  const [roles, setRoles] = useState("");
  const [cities, setCities] = useState("");
  const [level, setLevel] = useState("full-time, new grad 2027");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [jobs, setJobs] = useState<JobHitT[]>([]);
  const [sources, setSources] = useState<{ url: string; title: string }[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true); setJobs([]);
    try {
      const r = await api<{ jobs: JobHitT[]; sources: { url: string; title: string }[] }>("/api/search", { roles, cities, level, extra });
      setJobs(r.jobs); setSources(r.sources);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="card grid gap-3 md:grid-cols-2">
        <div><label htmlFor="roles" className="label">Roles</label><input id="roles" className="input" required value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="consulting analyst, strategy, VC analyst" /></div>
        <div><label htmlFor="cities" className="label">Cities</label><input id="cities" className="input" required value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Boston, New York, Washington DC" /></div>
        <div><label htmlFor="level" className="label">Level</label><input id="level" className="input" value={level} onChange={(e) => setLevel(e.target.value)} /></div>
        <div><label htmlFor="extra" className="label">Anything else</label><input id="extra" className="input" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="no clearance roles, energy focus…" /></div>
        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <p className="text-xs text-ink/50">Searches the live web — takes about a minute. Limited per day.</p>
          <button className="btn" disabled={busy}>{busy ? "Searching…" : "Find open roles"}</button>
        </div>
      </form>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {jobs.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="p-3">Role</th><th className="p-3">Location</th><th className="p-3">Status</th><th className="p-3">Fit</th><th className="p-3"></th>
            </tr></thead>
            <tbody>
              {jobs.map((j, i) => {
                const key = j.company + j.title;
                return (
                  <tr key={i} className="border-b border-line align-top last:border-0">
                    <td className="p-3"><p className="font-medium">{j.company}</p>{j.url ? <a className="text-brand underline" href={j.url} target="_blank" rel="noopener">{j.title}</a> : <p>{j.title}</p>}</td>
                    <td className="p-3">{j.location}</td>
                    <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs ${STATUS[j.status]}`}>{j.status.replace("_", " ")}</span>{j.deadline && <p className="mt-1 text-xs text-ink/50">{j.deadline}</p>}</td>
                    <td className="p-3 text-ink/70">{j.why}</td>
                    <td className="p-3"><button className="btn-ghost" disabled={saved.has(key)} onClick={async () => { await onSave(j); setSaved(new Set(saved).add(key)); }}>{saved.has(key) ? "Saved" : "Save"}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {sources.length > 0 && (
        <div className="text-xs text-ink/50">
          <p className="mb-1 font-medium">Sources</p>
          <ul className="space-y-0.5">{sources.map((s) => <li key={s.url}><a className="underline" href={s.url} target="_blank" rel="noopener">{s.title}</a></li>)}</ul>
        </div>
      )}
    </div>
  );
}
