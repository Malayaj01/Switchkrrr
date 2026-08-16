"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function ReassignHustleForm({ hustleId, mentors }: { hustleId: string; mentors: { id: string; name: string; company: string }[] }) {
  const router = useRouter(); const [mentorId, setMentorId] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const response = await fetch(`/api/admin/hustles/${hustleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mentorId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Could not reassign."); } finally { setBusy(false); } }
  return <form className="form-actions" onSubmit={submit}><label>Reassign to <select required value={mentorId} onChange={(e) => setMentorId(e.target.value)}><option value="">Choose verified mentor</option>{mentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.name} — {mentor.company}</option>)}</select></label><button className="button" disabled={busy}>{busy ? "Reassigning…" : "Reassign"}</button>{error && <p className="error">{error}</p>}</form>;
}
