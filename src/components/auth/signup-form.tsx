"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const roles = {
  candidate: "CANDIDATE",
  mentor: "MENTOR",
} as const;

type SignupRole = (typeof roles)[keyof typeof roles];

export function SignupForm() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole>(roles.candidate);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        role,
        yearsExperience: payload.yearsExperience || 0,
        helpCompanies: splitList(String(payload.helpCompanies || "")),
      }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Could not create account.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form form-grid" onSubmit={onSubmit}>
      <div className="segmented">
        <button type="button" className={role === roles.candidate ? "active" : ""} onClick={() => setRole(roles.candidate)}>
          Candidate
        </button>
        <button type="button" className={role === roles.mentor ? "active" : ""} onClick={() => setRole(roles.mentor)}>
          Mentor
        </button>
      </div>

      <Field name="name" label="Full name" required />
      <Field name="username" label="Username" required />
      <Field name="email" label="Email" type="email" required />
      <Field name="password" label="Password" type="password" minLength={8} required />
      <Field name="currentCompany" label="Current company" required />
      <Field name="designation" label="Current role / designation" required />

      {role === roles.candidate ? (
        <>
          <Field name="goalRole" label="Goal role" placeholder="Associate Product Manager" required />
          <Field name="targetTimeline" label="Target switch timeline" type="date" />
        </>
      ) : (
        <>
          <Field name="yearsExperience" label="Years of experience" type="number" min={0} max={60} required />
          <Field name="domain" label="Domain" placeholder="Product, SaaS, Fintech" required />
          <Field name="linkedinUrl" label="LinkedIn URL" type="url" />
          <Field name="helpCompanies" label="Companies you can help with" placeholder="Google, Razorpay, Swiggy" />
        </>
      )}

      {error && <p className="error">{error}</p>}
      <button className="button" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create account"}
      </button>
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
