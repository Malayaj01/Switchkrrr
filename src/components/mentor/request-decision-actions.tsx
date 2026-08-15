"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RequestDecisionActionsProps = {
  requestId: string;
};

export function RequestDecisionActions({ requestId }: RequestDecisionActionsProps) {
  const router = useRouter();
  const [mentorResponse, setMentorResponse] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<"APPROVED" | "DECLINED" | null>(null);

  async function decide(decision: "APPROVED" | "DECLINED") {
    setError("");
    setIsSubmitting(decision);

    const response = await fetch(`/api/mentor-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, mentorResponse }),
    });
    const data = await response.json();
    setIsSubmitting(null);

    if (!response.ok) {
      setError(data.error || "Could not update request.");
      return;
    }

    setMentorResponse("");
    router.refresh();
  }

  return (
    <div className="request-decision-box">
      <textarea
        aria-label="Mentor response"
        placeholder="Optional response for candidate"
        rows={3}
        value={mentorResponse}
        onChange={(event) => setMentorResponse(event.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <div className="panel-actions">
        <button className="button" disabled={Boolean(isSubmitting)} onClick={() => decide("APPROVED")}>
          <Check size={16} />
          {isSubmitting === "APPROVED" ? "Approving..." : "Approve"}
        </button>
        <button className="button danger-button" disabled={Boolean(isSubmitting)} onClick={() => decide("DECLINED")}>
          <X size={16} />
          {isSubmitting === "DECLINED" ? "Declining..." : "Decline"}
        </button>
      </div>
    </div>
  );
}

