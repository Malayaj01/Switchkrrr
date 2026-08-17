"use client";

import { HustleStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { allowedNextStatuses, hustleActionLabel } from "@/domain/hustle";

export function HustleStatusActions({ hustleId, status }: { hustleId: string; status: HustleStatus }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<HustleStatus | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: HustleStatus) {
    setPendingStatus(nextStatus);
    setError("");
    try {
      const response = await fetch(`/api/hustles/${hustleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to update this Hustle.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update this Hustle.");
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <div className="panel-actions">
      {allowedNextStatuses(status).map((nextStatus) => (
        <button
          className={nextStatus === HustleStatus.COMPLETED ? "button secondary" : "button"}
          disabled={pendingStatus !== null}
          key={nextStatus}
          onClick={() => updateStatus(nextStatus)}
          type="button"
        >
          {pendingStatus === nextStatus ? "Saving…" : hustleActionLabel(nextStatus)}
        </button>
      ))}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
