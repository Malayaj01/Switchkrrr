"use client";

import { Priority } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LeadCreateFormProps = {
  hustleId: string;
};

export function LeadCreateForm({ hustleId }: LeadCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(`/api/hustles/${hustleId}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Could not add lead.");
      return;
    }

    form.reset();
    setMessage("Lead added.");
    router.refresh();
  }

  return (
    <form className="lead-create-form form-grid card" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">Mentor action</p>
        <h2>Add lead</h2>
      </div>
      <div className="two-column-form">
        <Field name="company" label="Company" required />
        <Field name="role" label="Role" required />
        <Field name="domain" label="Domain" />
        <Field name="location" label="Location" />
        <Field name="jobLink" label="Job link" type="url" />
        <Field name="applicationLink" label="Application link" type="url" />
        <Field name="contactName" label="Contact name" />
        <Field name="contactEmail" label="Contact email" type="email" />
        <label>
          Priority
          <select name="priority" defaultValue={Priority.MEDIUM}>
            {Object.values(Priority).map((priority) => (
              <option key={priority} value={priority}>
                {formatEnum(priority)}
              </option>
            ))}
          </select>
        </label>
        <Field name="followUpDate" label="Follow-up date" type="date" />
      </div>
      <label>
        Mentor comment
        <textarea name="mentorComment" rows={4} placeholder="Context, referral notes, or application strategy." />
      </label>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <div className="form-actions">
        <button className="button" disabled={isSubmitting}>
          <Plus size={17} />
          {isSubmitting ? "Adding..." : "Add lead"}
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

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

