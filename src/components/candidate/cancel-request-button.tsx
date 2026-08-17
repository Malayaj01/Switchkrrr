"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setIsCancelling(true);
    setError("");
    try {
      const response = await fetch(`/api/mentor-requests/${requestId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not cancel request.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not cancel request.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div>
      <button className="button secondary" disabled={isCancelling} onClick={cancel} type="button">
        <X size={15} />
        {isCancelling ? "Cancelling…" : "Cancel request"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
