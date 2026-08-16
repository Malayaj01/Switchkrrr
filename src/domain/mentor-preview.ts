import type { MentorProfile, MentorRequestStatus } from "@prisma/client";
import { experienceRange } from "@/lib/format";
import type { MentorMatch } from "@/domain/matching";

/**
 * The anonymised shape a candidate is allowed to see before their request is
 * approved. Never add name, email, exact company or LinkedIn to this type —
 * hiding those is a product rule, not a UI preference.
 */
export type MentorPreview = {
  id: string;
  domain: string;
  designation: string;
  experienceRange: string;
  companySignal: string[];
  currentCompanyType: string;
  verificationStatus: string;
  score: number;
  reasons: string[];
  requestStatus: string | null;
};

export function toMentorPreview(
  match: MentorMatch,
  requestStatus: MentorRequestStatus | null,
): MentorPreview {
  const { mentor, reasons, score } = match;

  return {
    id: mentor.id,
    domain: mentor.domain,
    designation: anonymizeDesignation(mentor.designation),
    experienceRange: experienceRange(mentor.yearsExperience),
    companySignal: mentor.helpCompanies.slice(0, 3),
    currentCompanyType: toCompanyType(mentor.currentCompany),
    verificationStatus: mentor.verificationStatus,
    score,
    reasons,
    requestStatus,
  };
}

export function anonymizeDesignation(designation: MentorProfile["designation"]) {
  if (/manager|lead|head/i.test(designation)) return "Leadership mentor";
  if (/product/i.test(designation)) return "Product mentor";
  if (/engineer|developer|architect/i.test(designation)) return "Engineering mentor";
  return "Career mentor";
}

export function toCompanyType(company: MentorProfile["currentCompany"]) {
  if (/google|microsoft|amazon|meta|apple/i.test(company)) return "Big Tech";
  if (/razorpay|phonepe|paytm|stripe/i.test(company)) return "Fintech";
  if (/swiggy|zomato|zepto|meesho/i.test(company)) return "Consumer internet";
  return "Growth company";
}
