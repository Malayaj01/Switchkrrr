"use client";

import { VerificationStatus } from "@prisma/client";
import { Check, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type MentorVerificationActionsProps = {
  currentStatus: VerificationStatus;
  mentorId: string;
  /** Compact mode drops the note field, for dense list rows. */
  compact?: boolean;
};

export function MentorVerificationActions({
  compact = false,
  currentStatus,
  mentorId,
}: MentorVerificationActionsProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pendingDecision, setPendingDecision] = useState<VerificationStatus | null>(null);

  const isBusy = pendingDecision !== null || isRefreshing;

  async function updateStatus(status: VerificationStatus) {
    setError("");
    setPendingDecision(status);

    try {
      const response = await fetch(`/api/admin/mentors/${mentorId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Could not update mentor verification.");
        return;
      }

      setNote("");
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPendingDecision(null);
    }
  }

  function buttonLabel(status: VerificationStatus, idle: string, busy: string) {
    return pendingDecision === status ? busy : idle;
  }

  return (
    <div className="verification-actions">
      {!compact && (
        <label className="verification-note">
          <span>Note (optional, shown to the mentor)</span>
          <textarea
            disabled={isBusy}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason for the decision, or what the mentor should fix."
            rows={2}
            value={note}
          />
        </label>
      )}

      <div className="panel-actions">
        {currentStatus !== VerificationStatus.VERIFIED && (
          <button
            className="button"
            disabled={isBusy}
            onClick={() => updateStatus(VerificationStatus.VERIFIED)}
            type="button"
          >
            <Check size={16} />
            {buttonLabel(VerificationStatus.VERIFIED, "Approve", "Approving...")}
          </button>
        )}
        {currentStatus !== VerificationStatus.REJECTED && (
          <button
            className="button danger-button"
            disabled={isBusy}
            onClick={() => updateStatus(VerificationStatus.REJECTED)}
            type="button"
          >
            <X size={16} />
            {buttonLabel(VerificationStatus.REJECTED, "Reject", "Rejecting...")}
          </button>
        )}
        {currentStatus !== VerificationStatus.PENDING && (
          <button
            className="button secondary"
            disabled={isBusy}
            onClick={() => updateStatus(VerificationStatus.PENDING)}
            type="button"
          >
            <RotateCcw size={16} />
            {buttonLabel(VerificationStatus.PENDING, "Reset to pending", "Resetting...")}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
