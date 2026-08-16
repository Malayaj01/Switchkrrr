"use client";

import type { MentorProfile } from "@prisma/client";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MentorProfileForm({ profile }: { profile: MentorProfile }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      currentCompany: String(formData.get("currentCompany") || ""), designation: String(formData.get("designation") || ""),
      yearsExperience: Number(formData.get("yearsExperience") || 0), domain: String(formData.get("domain") || ""),
      linkedinUrl: String(formData.get("linkedinUrl") || ""), bio: String(formData.get("bio") || ""),
      helpCompanies: String(formData.get("helpCompanies") || "").split(",").map((item) => item.trim()).filter(Boolean),
    };
    try {
      const response = await fetch("/api/mentor/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save profile.");
      setMessage("Profile saved."); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save profile."); }
    finally { setIsSubmitting(false); }
  }
  return <form className="profile-form form-grid card" onSubmit={submit}>
    <div className="two-column-form">
      <Field name="currentCompany" label="Current company" defaultValue={profile.currentCompany} required />
      <Field name="designation" label="Role / designation" defaultValue={profile.designation} required />
      <Field name="yearsExperience" label="Years of experience" defaultValue={profile.yearsExperience} min={0} type="number" required />
      <Field name="domain" label="Domain" defaultValue={profile.domain} required />
    </div>
    <Field name="linkedinUrl" label="LinkedIn URL" defaultValue={profile.linkedinUrl ?? ""} type="url" />
    <Field name="helpCompanies" label="Companies you can help with" defaultValue={profile.helpCompanies.join(", ")} placeholder="Google, Razorpay, Swiggy" />
    <label>Bio<textarea defaultValue={profile.bio ?? ""} name="bio" rows={5} /></label>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success">{message}</p>}
    <div className="form-actions"><button className="button" disabled={isSubmitting}><Save size={17} />{isSubmitting ? "Saving…" : "Save profile"}</button></div>
  </form>;
}
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) { return <label>{label}<input {...props} /></label>; }
