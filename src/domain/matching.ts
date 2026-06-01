import type { CandidateProfile, MentorProfile } from "@prisma/client";

export type MentorMatch = {
  mentor: MentorProfile;
  score: number;
  reasons: string[];
};

export function scoreMentorForCandidate(candidate: CandidateProfile, mentor: MentorProfile): MentorMatch {
  const targetCompanies = normalizeSet(candidate.targetCompanies);
  const helpCompanies = normalizeSet(mentor.helpCompanies);
  const reasons: string[] = [];
  let score = 0;

  if (targetCompanies.has(normalize(mentor.currentCompany))) {
    score += 40;
    reasons.push(`Works at ${mentor.currentCompany}`);
  }

  const helpOverlap = [...helpCompanies].filter((company) => targetCompanies.has(company));
  if (helpOverlap.length > 0) {
    score += Math.min(30, helpOverlap.length * 10);
    reasons.push(`Can help with ${helpOverlap.slice(0, 3).join(", ")}`);
  }

  if (candidate.preferredDomains.map(normalize).includes(normalize(mentor.domain))) {
    score += 20;
    reasons.push(`Domain match: ${mentor.domain}`);
  }

  if (mentor.yearsExperience >= 3) {
    score += 10;
    reasons.push(`${mentor.yearsExperience}+ years experience`);
  }

  return { mentor, score, reasons };
}

function normalizeSet(values: string[]) {
  return new Set(values.map(normalize).filter(Boolean));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
