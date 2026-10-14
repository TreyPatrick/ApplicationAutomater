"use client";
import { useState } from "react";
import type { ResumeT } from "@/lib/schemas";
import { api, downloadPdf } from "./api";

type Kind = "cover_letter" | "answer" | "outreach";

export default function TailorTab({ hasResume }: { hasResume: boolean }) {
  const [company, setCompany] = useState("");
  const [job, setJob] = useState("");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");
  const [tailored, setTailored] = useState<{ resume: ResumeT; changes: string[]; gaps: string[] } | null>(null);
  const [text, setText] = useState<{ kind: Kind; body: string } | null>(null);

  if (!hasResume) return <div className="card text-sm text-ink/70">Upload your resume on the Resume tab first.</div>;

  async function tailor() {
    setErr(""); setBusy("tailor");
    try { setTailored(await api("/api/tailor", { job })); } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function write(kind: Kind) {
    setErr(""); setBusy(kind);
    try { const r = await api<{ text: string }>("/api/write", { kind, job, question, company }); setText({ kind, body: r.text }); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function copy(t: string) { try { await navigator.clipboard.writeText(t); } catch { /* clipboard blocked */ } }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-3">
        <div><label htmlFor="company" className="label">Company</label><input id="company" className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Deloitte" /></div>
        <div><label htmlFor="job" className="label">Job description</label><textarea id="job" className="input h-56" value={job} onChange={(e) => setJob(e.target.value)} placeholder="Paste the full posting text" /></div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" disabled={!!busy || job.length < 30} onClick={tailor}>{busy === "tailor" ? "Tailoring…" : "Tailor resume"}</button>
          <button className="btn-ghost" disabled={!!busy || job.length < 30} onClick={() => write("cover_letter")}>{busy === "cover_letter" ? "Writing…" : "Cover letter"}</button>
          <button className="btn-ghost" disabled={!!busy} onClick={() => write("outreach")}>{busy === "outreach" ? "Writing…" : "Networking note"}</button>
        </div>
        <div><label htmlFor="q" className="label">Application question</label><textarea id="q" className="input h-20" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Why are you interested in this role? (250 words)" /></div>
        <button className="btn-ghost" disabled={!!busy || question.length < 5} onClick={() => write("answer")}>{busy === "answer" ? "Writing…" : "Draft answer"}</button>
        {err && <p className="text-sm text-red-700">{err}</p>}
      </div>
      <div className="space-y-4">
        {tailored && (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tailored resume</h3>
              <button className="btn-ghost" onClick={() => downloadPdf(tailored.resume, `${tailored.resume.name.replace(/\s+/g, "_")}_Resume_${(company || "Tailored").replace(/\W+/g, "_")}.pdf`)}>Download PDF</button>
            </div>
            <div><p className="label">What changed</p><ul className="list-disc space-y-1 pl-5 text-sm">{tailored.changes.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
            {tailored.gaps.length > 0 && <div><p className="label">Gaps to address honestly (not added)</p><ul className="list-disc space-y-1 pl-5 text-sm text-ink/70">{tailored.gaps.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
          </div>
        )}
        {text && (
          <div className="card space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{{ cover_letter: "Cover letter", answer: "Answer", outreach: "Networking note" }[text.kind]}</h3>
              <button className="btn-ghost" onClick={() => copy(text.body)}>Copy</button>
            </div>
            <textarea className="input h-80 text-sm" value={text.body} onChange={(e) => setText({ ...text, body: e.target.value })} />
            <p className="text-xs text-ink/50">Read it and make it yours before sending.</p>
          </div>
        )}
        {!tailored && !text && <div className="card text-sm text-ink/60">Paste a posting, then tailor your resume or draft a cover letter. Results show up here.</div>}
      </div>
    </div>
  );
}
