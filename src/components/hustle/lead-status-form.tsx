"use client";

import { LeadStatus } from "@prisma/client";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LeadStatusFormProps = {
  currentComment: string | null;
  currentStatus: LeadStatus;
  leadId: string;
};

export function LeadStatusForm({ currentComment, currentStatus, leadId }: LeadStatusFormProps) {
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
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Could not update lead.");
      return;
    }

    setMessage("Progress saved.");
    router.refresh();
  }

  return (
    <form className="lead-status-form" onSubmit={onSubmit}>
      <div className="two-column-form">
        <label>
          Status
          <select name="status" defaultValue={currentStatus}>
            {Object.values(LeadStatus).map((status) => (
              <option key={status} value={status}>
                {formatEnum(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Candidate comment
          <input name="candidateComment" defaultValue={currentComment ?? ""} placeholder="Short update" />
        </label>
      </div>
      <label>
        Progress note
        <textarea name="note" rows={3} placeholder="What changed in this step?" />
      </label>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <div className="form-actions">
        <button className="button" disabled={isSubmitting}>
          <Save size={16} />
          {isSubmitting ? "Saving..." : "Save progress"}
        </button>
      </div>
    </form>
  );
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

