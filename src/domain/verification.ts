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

/**
 * Fields an admin actually verifies. Changing any of them invalidates the
 * decision, otherwise a mentor could get verified at one company and then
 * rewrite their whole identity while keeping the badge.
 *
 * Bio, LinkedIn and helpCompanies are deliberately excluded — they are
 * presentation, not identity, and re-reviewing on every bio tweak would make
 * the queue useless.
 */
export const identityVerificationFields = [
  "currentCompany",
  "designation",
  "yearsExperience",
  "domain",
] as const;

type IdentityFields = Pick<
  {
    currentCompany: string;
    designation: string;
    yearsExperience: number;
    domain: string;
  },
  (typeof identityVerificationFields)[number]
>;

export function hasIdentityChanged(before: IdentityFields, after: IdentityFields) {
  return identityVerificationFields.some((field) => before[field] !== after[field]);
}

/**
 * Whether an edit should send the mentor back to the verification queue.
 *
 * Only a VERIFIED mentor is reset. A REJECTED mentor stays rejected, so editing
 * cannot be used to escape a rejection.
 */
export function shouldResetVerification(
  status: VerificationStatus,
  before: IdentityFields,
  after: IdentityFields,
) {
  return status === VerificationStatus.VERIFIED && hasIdentityChanged(before, after);
}

export const verificationResetNote =
  "Automatically returned to review because the mentor changed their company, designation, experience or domain.";

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
