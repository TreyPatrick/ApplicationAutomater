"use client";
import { useState } from "react";
import type { ResumeT } from "@/lib/schemas";
import { api, downloadPdf } from "./api";

export default function ResumeTab({ resume, onChange }: { resume: ResumeT | null; onChange: (r: ResumeT) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [json, setJson] = useState("");
  const [editing, setEditing] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(""); setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", f);
      const { resume } = await api<{ resume: ResumeT }>("/api/resume", fd);
      onChange(resume);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); e.target.value = ""; }
  }

  async function saveEdits() {
    setErr("");
    try {
      const { resume } = await api<{ resume: ResumeT }>("/api/resume", { resume: JSON.parse(json) }, "PUT");
      onChange(resume); setEditing(false);
    } catch (e: any) { setErr(e.message.includes("JSON") ? "That isn't valid JSON." : e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Your base resume</h2>
          <p className="text-sm text-ink/60">Everything else is built from this. Upload a PDF; Claude reads it into editable sections.</p>
        </div>
        <label className="btn cursor-pointer">
          {busy ? "Reading…" : resume ? "Replace PDF" : "Upload PDF"}
          <input type="file" accept="application/pdf" className="hidden" onChange={upload} disabled={busy} />
        </label>
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      {resume && !editing && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-lg font-semibold">{resume.name}</p>
              <p className="text-sm text-ink/60">{resume.contact.join(" · ")}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => { setJson(JSON.stringify(resume, null, 2)); setEditing(true); }}>Edit</button>
              <button className="btn-ghost" onClick={() => downloadPdf(resume, `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`)}>Download PDF</button>
            </div>
          </div>
          {resume.sections.map((s) => (
            <div key={s.title}>
              <p className="label">{s.title}</p>
              <ul className="space-y-1 text-sm">
                {s.entries.map((e, i) => <li key={i}><span className="font-medium">{e.org}</span>{e.role && ` — ${e.role}`} <span className="text-ink/50">{e.dates}</span></li>)}
              </ul>
            </div>
          ))}
          <p className="text-xs text-ink/50">Something wrong or outdated (like a role you want removed)? Use Edit before tailoring.</p>
        </div>
      )}
      {editing && (
        <div className="card space-y-3">
          <p className="text-sm text-ink/60">Edit the text directly. Keep the structure the same.</p>
          <textarea className="input h-96 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn" onClick={saveEdits}>Save</button>
            <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
