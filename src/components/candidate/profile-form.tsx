"use client";

import { JobTypePreference, type CandidateProfile } from "@prisma/client";
import { CheckCircle2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileFormProps = {
  profile: CandidateProfile;
};

export function CandidateProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      currentCompany: String(formData.get("currentCompany") || ""),
      designation: String(formData.get("designation") || ""),
      goalRole: String(formData.get("goalRole") || ""),
      targetTimeline: String(formData.get("targetTimeline") || ""),
      resumeText: String(formData.get("resumeText") || ""),
      skills: splitList(String(formData.get("skills") || "")),
      preferredLocations: splitList(String(formData.get("preferredLocations") || "")),
      expectedSalaryMin: numberOrNull(formData.get("expectedSalaryMin")),
      expectedSalaryMax: numberOrNull(formData.get("expectedSalaryMax")),
      targetCompanies: splitList(String(formData.get("targetCompanies") || "")),
      preferredDomains: splitList(String(formData.get("preferredDomains") || "")),
      jobTypePreference: String(formData.get("jobTypePreference") || "") || null,
    };

    const response = await fetch("/api/candidate/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Could not save profile.");
      return;
    }

    setMessage(data.profile.profileCompletedAt ? "Profile completed and saved." : "Profile saved as draft.");
    router.refresh();
  }

  return (
    <form className="profile-form form-grid card" onSubmit={onSubmit}>
      <div className="form-section-head">
        <div>
          <p className="eyebrow">Candidate profile</p>
          <h2>Switch goals</h2>
        </div>
        {profile.profileCompletedAt && (
          <span className="success-chip">
            <CheckCircle2 size={16} />
            Complete
          </span>
        )}
      </div>

      <div className="two-column-form">
        <Field name="currentCompany" label="Current company" defaultValue={profile.currentCompany} required />
        <Field name="designation" label="Current role / designation" defaultValue={profile.designation} required />
        <Field name="goalRole" label="Goal role" defaultValue={profile.goalRole} required />
        <Field
          name="targetTimeline"
          label="Target switch timeline"
          type="date"
          defaultValue={toDateInputValue(profile.targetTimeline)}
        />
      </div>

      <Field
        name="skills"
        label="Skills"
        defaultValue={profile.skills.join(", ")}
        placeholder="React, SQL, Product analytics"
        required
      />
      <Field
        name="targetCompanies"
        label="Target companies"
        defaultValue={profile.targetCompanies.join(", ")}
        placeholder="Google, Razorpay, Swiggy"
        required
      />
      <Field
        name="preferredDomains"
        label="Preferred domains"
        defaultValue={profile.preferredDomains.join(", ")}
        placeholder="SaaS, Fintech, Consumer apps"
        required
      />
      <Field
        name="preferredLocations"
        label="Preferred locations"
        defaultValue={profile.preferredLocations.join(", ")}
        placeholder="Bengaluru, Delhi NCR, Remote"
        required
      />

      <div className="two-column-form">
        <Field
          name="expectedSalaryMin"
          label="Expected salary min"
          type="number"
          min={0}
          defaultValue={profile.expectedSalaryMin ?? ""}
        />
        <Field
          name="expectedSalaryMax"
          label="Expected salary max"
          type="number"
          min={0}
          defaultValue={profile.expectedSalaryMax ?? ""}
        />
      </div>

      <label>
        Job type preference
        <select name="jobTypePreference" defaultValue={profile.jobTypePreference ?? ""} required>
          <option value="">Select preference</option>
          {Object.values(JobTypePreference).map((preference) => (
            <option key={preference} value={preference}>
              {formatEnum(preference)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Resume text
        <textarea
          name="resumeText"
          defaultValue={profile.resumeText ?? ""}
          placeholder="Paste resume text for future mentor matching and resume analysis."
          rows={8}
        />
      </label>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <div className="form-actions">
        <button className="button" disabled={isSubmitting}>
          <Save size={17} />
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label>
      {label}
      <input {...props} />
    </label>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  return raw ? Number(raw) : null;
}

function toDateInputValue(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

