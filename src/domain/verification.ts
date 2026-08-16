import { VerificationStatus } from "@prisma/client";

/**
 * Product rule for mentor verification.
 *
 * A `REJECTED` mentor is removed from the platform's supply side: they are hidden
 * from candidate recommendations and cannot receive new requests. `PENDING`
 * mentors stay visible but are clearly marked as unverified, so onboarding is not
 * blocked on an admin being online. Existing Hustles are never torn down by a
 * rejection — that is a manual admin decision, not an automatic side effect.
 */
export const requestableVerificationStatuses: VerificationStatus[] = [
  VerificationStatus.VERIFIED,
  VerificationStatus.PENDING,
];

export function isMentorRequestable(status: VerificationStatus) {
  return requestableVerificationStatuses.includes(status);
}

export function verificationLabel(status: VerificationStatus) {
  if (status === VerificationStatus.VERIFIED) return "Verified";
  if (status === VerificationStatus.REJECTED) return "Rejected";
  return "Pending review";
}

/** Maps a status onto the chip classes already defined in globals.css. */
export function verificationChipClassName(status: VerificationStatus) {
  if (status === VerificationStatus.VERIFIED) return "approved";
  if (status === VerificationStatus.REJECTED) return "declined";
  return "pending";
}
