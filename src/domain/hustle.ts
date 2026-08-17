import { HustleStatus } from "@prisma/client";

/**
 * Allowed Hustle status transitions.
 *
 * Only ACTIVE Hustles count against the candidate and mentor capacity limits,
 * so pausing or completing one frees a slot and moving back to ACTIVE has to
 * re-check capacity. A Hustle is never deleted — history stays intact.
 */
const allowedTransitions: Record<HustleStatus, HustleStatus[]> = {
  [HustleStatus.ACTIVE]: [HustleStatus.PAUSED, HustleStatus.COMPLETED],
  [HustleStatus.PAUSED]: [HustleStatus.ACTIVE, HustleStatus.COMPLETED],
  [HustleStatus.COMPLETED]: [HustleStatus.ACTIVE],
};

export function canTransition(from: HustleStatus, to: HustleStatus) {
  return allowedTransitions[from].includes(to);
}

export function allowedNextStatuses(from: HustleStatus) {
  return allowedTransitions[from];
}

/** Moving back to ACTIVE consumes a slot again, so both caps must be re-checked. */
export function consumesCapacity(status: HustleStatus) {
  return status === HustleStatus.ACTIVE;
}

export function hustleStatusLabel(status: HustleStatus) {
  if (status === HustleStatus.ACTIVE) return "Active";
  if (status === HustleStatus.PAUSED) return "Paused";
  return "Completed";
}

/** Verb shown on the button that moves a Hustle into this status. */
export function hustleActionLabel(status: HustleStatus) {
  if (status === HustleStatus.ACTIVE) return "Reopen";
  if (status === HustleStatus.PAUSED) return "Pause";
  return "Mark complete";
}

export function hustleStatusChipClassName(status: HustleStatus) {
  if (status === HustleStatus.ACTIVE) return "approved";
  if (status === HustleStatus.PAUSED) return "pending";
  return "";
}
