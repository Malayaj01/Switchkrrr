"use client";

import { CheckCircle2, Clock3, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { MentorPreview } from "@/domain/mentor-preview";

export type { MentorPreview };

type MentorPreviewCardProps = {
  canRequest: boolean;
  mentor: MentorPreview;
};

export function MentorPreviewCard({ canRequest, mentor }: MentorPreviewCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRequest = Boolean(mentor.requestStatus);

  async function sendRequest() {
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/mentor-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId: mentor.id, candidateMessage: message }),
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Could not send mentor request.");
      return;
    }

    setMessage("");
    router.refresh();
  }

  return (
    <article className="mentor-preview-card card">
      <div className="mentor-preview-top">
        <div className="mentor-avatar anonymous">M</div>
        <div>
          <h2>{mentor.designation}</h2>
          <p className="muted">
            {mentor.domain} - {mentor.experienceRange} - {mentor.currentCompanyType}
          </p>
        </div>
        <span className="score-chip">
          <Sparkles size={15} />
          {mentor.score}
        </span>
      </div>

      <div className="match-signals">
        <span className={mentor.verificationStatus === "VERIFIED" ? "signal-verified" : "signal-pending"}>
          <ShieldCheck size={14} />
          {mentor.verificationStatus === "VERIFIED" ? "Verified" : "Not yet verified"}
        </span>
        {mentor.companySignal.map((company) => (
          <span key={company}>{company}</span>
        ))}
      </div>

      {mentor.reasons.length > 0 && (
        <ul className="reason-list">
          {mentor.reasons.slice(0, 4).map((reason) => (
            <li key={reason}>
              <CheckCircle2 size={15} />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {hasRequest ? (
        <span className="request-status-chip">
          <Clock3 size={15} />
          Request {mentor.requestStatus!.toLowerCase()}
        </span>
      ) : !canRequest ? (
        <span className="request-status-chip">Requests unavailable right now</span>
      ) : (
        <div className="request-box">
          <textarea
            aria-label="Request message"
            placeholder="Short message for mentor"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button className="button" disabled={isSubmitting} onClick={sendRequest}>
            <Send size={16} />
            {isSubmitting ? "Sending..." : "Request mentor"}
          </button>
        </div>
      )}
    </article>
  );
}
