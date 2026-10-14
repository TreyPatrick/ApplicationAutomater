"use client";
export type Job = { id: string; company: string; title: string; location: string | null; url: string | null; deadline: string | null; status: string; notes: string | null };
export const STATUSES = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"];

export default function TrackerTab({ jobs, onUpdate, onDelete, onAdd }: {
  jobs: Job[]; onUpdate: (id: string, patch: Partial<Job>) => void; onDelete: (id: string) => void; onAdd: (j: { company: string; title: string }) => void;
}) {
  const counts = STATUSES.map((s) => [s, jobs.filter((j) => j.status === s).length] as const);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {counts.map(([s, n]) => <div key={s} className="card px-4 py-2"><p className="text-xl font-semibold tabular-nums">{n}</p><p className="text-xs uppercase tracking-wide text-ink/50">{s}</p></div>)}
      </div>
      <form className="card flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onAdd({ company: String(f.get("company")), title: String(f.get("title")) }); e.currentTarget.reset(); }}>
        <input name="company" id="add-company" required className="input max-w-xs" placeholder="Company" />
        <input name="title" id="add-title" required className="input max-w-xs" placeholder="Role" />
        <button className="btn">Add</button>
      </form>
      {jobs.length === 0 ? <div className="card text-sm text-ink/60">Nothing tracked yet. Save roles from Find Jobs or add one above.</div> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/50"><th className="p-3">Role</th><th className="p-3">Deadline</th><th className="p-3">Status</th><th className="p-3">Notes</th><th className="p-3"></th></tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3"><p className="font-medium">{j.company}</p>{j.url ? <a className="text-brand underline" href={j.url} target="_blank" rel="noopener">{j.title}</a> : j.title}<p className="text-xs text-ink/50">{j.location}</p></td>
                  <td className="p-3 text-ink/70">{j.deadline}</td>
                  <td className="p-3"><select aria-label="Status" className="input py-1" value={j.status} onChange={(e) => onUpdate(j.id, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td className="p-3"><input aria-label="Notes" className="input py-1" defaultValue={j.notes ?? ""} onBlur={(e) => e.target.value !== (j.notes ?? "") && onUpdate(j.id, { notes: e.target.value })} /></td>
                  <td className="p-3"><button className="text-xs text-ink/50 hover:text-red-700" onClick={() => onDelete(j.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
