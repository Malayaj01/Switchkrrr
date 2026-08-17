"use client";

import type { MentorProfile } from "@prisma/client";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MentorProfileFormProps = {
  profile: MentorProfile;
};

export function MentorProfileForm({ profile }: MentorProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      currentCompany: String(formData.get("currentCompany") || ""),
      designation: String(formData.get("designation") || ""),
      yearsExperience: Number(formData.get("yearsExperience") || 0),
      domain: String(formData.get("domain") || ""),
      linkedinUrl: String(formData.get("linkedinUrl") || ""),
      bio: String(formData.get("bio") || ""),
      helpCompanies: String(formData.get("helpCompanies") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/mentor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; verificationReset?: boolean };
      if (!response.ok) throw new Error(data.error || "Could not save profile.");

      setMessage(
        data.verificationReset
          ? "Profile saved. Because your company, designation, experience or domain changed, your profile has gone back to the verification queue."
          : "Profile saved.",
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="profile-form form-grid card" onSubmit={submit}>
      <div className="form-section-head">
        <div>
          <h2>Edit profile</h2>
          <p className="muted">
            Changing your company, designation, experience or domain sends your profile back for
            verification, because those are the details an admin checks.
          </p>
        </div>
      </div>

      <div className="two-column-form">
        <Field defaultValue={profile.currentCompany} label="Current company" name="currentCompany" required />
        <Field defaultValue={profile.designation} label="Role / designation" name="designation" required />
        <Field
          defaultValue={profile.yearsExperience}
          label="Years of experience"
          max={80}
          min={0}
          name="yearsExperience"
          required
          type="number"
        />
        <Field defaultValue={profile.domain} label="Domain" name="domain" required />
      </div>

      <Field defaultValue={profile.linkedinUrl ?? ""} label="LinkedIn URL" name="linkedinUrl" type="url" />
      <Field
        defaultValue={profile.helpCompanies.join(", ")}
        label="Companies you can help with"
        name="helpCompanies"
        placeholder="Google, Razorpay, Swiggy"
      />

      <label>
        Bio
        <textarea defaultValue={profile.bio ?? ""} maxLength={2000} name="bio" rows={5} />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="success">{message}</p>}

      <div className="form-actions">
        <button className="button" disabled={isSubmitting} type="submit">
          <Save size={17} />
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label>
      {label}
      <input {...inputProps} />
    </label>
  );
}
