import type { CandidateProfile, MentorProfile } from "@prisma/client";

export type MentorMatch = {
  mentor: MentorProfile;
  score: number;
  reasons: string[];
};

export function scoreMentorForCandidate(candidate: CandidateProfile, mentor: MentorProfile): MentorMatch {
  const targetCompanies = normalizeSet(candidate.targetCompanies);
  const helpCompanies = normalizeSet(mentor.helpCompanies);
  const preferredDomains = normalizeSet(candidate.preferredDomains);
  const candidateSkills = normalizeSet(candidate.skills);
  const mentorSearchText = normalizeSet([
    mentor.currentCompany,
    mentor.designation,
    mentor.domain,
    mentor.bio ?? "",
    ...mentor.helpCompanies,
  ]);
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

  if (preferredDomains.has(normalize(mentor.domain))) {
    score += 25;
    reasons.push(`Domain match: ${mentor.domain}`);
  }

  const skillSignals = [...candidateSkills].filter((skill) =>
    [...mentorSearchText].some((signal) => signal.includes(skill) || skill.includes(signal)),
  );
  if (skillSignals.length > 0) {
    score += Math.min(15, skillSignals.length * 5);
    reasons.push(`Relevant to ${skillSignals.slice(0, 2).join(", ")}`);
  }

  if (mentor.yearsExperience >= 8) {
    score += 15;
    reasons.push(`${mentor.yearsExperience}+ years experience`);
  } else if (mentor.yearsExperience >= 3) {
    score += 10;
    reasons.push(`${mentor.yearsExperience}+ years experience`);
  }

  if (mentor.verificationStatus === "VERIFIED") {
    score += 10;
    reasons.push("Verified mentor");
  }

  return { mentor, score, reasons };
}

export function rankMentorsForCandidate(candidate: CandidateProfile, mentors: MentorProfile[]) {
  return mentors
    .map((mentor) => scoreMentorForCandidate(candidate, mentor))
    .sort((left, right) => right.score - left.score || right.mentor.yearsExperience - left.mentor.yearsExperience);
}

function normalizeSet(values: string[]) {
  return new Set(values.map(normalize).filter(Boolean));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
