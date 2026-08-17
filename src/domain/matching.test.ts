import type { CandidateProfile, MentorProfile } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { rankMentorsForCandidate, scoreMentorForCandidate } from "@/domain/matching";

function candidate(overrides: Partial<CandidateProfile> = {}) {
  return {
    targetCompanies: [],
    preferredDomains: [],
    skills: [],
    ...overrides,
  } as CandidateProfile;
}

function mentor(overrides: Partial<MentorProfile> = {}) {
  return {
    id: "m1",
    currentCompany: "Acme",
    designation: "Engineer",
    domain: "SaaS",
    bio: "",
    helpCompanies: [],
    yearsExperience: 1,
    verificationStatus: "PENDING",
    ...overrides,
  } as MentorProfile;
}

describe("scoreMentorForCandidate", () => {
  it("scores an unrelated mentor at zero with no reasons", () => {
    const match = scoreMentorForCandidate(candidate(), mentor({ yearsExperience: 1 }));
    expect(match.score).toBe(0);
    expect(match.reasons).toEqual([]);
  });

  it("rewards a mentor who works at a target company most heavily", () => {
    const match = scoreMentorForCandidate(
      candidate({ targetCompanies: ["Google"] }),
      mentor({ currentCompany: "Google" }),
    );
    expect(match.score).toBeGreaterThanOrEqual(40);
    expect(match.reasons.join(" ")).toContain("Google");
  });

  it("matches company names case-insensitively", () => {
    const match = scoreMentorForCandidate(
      candidate({ targetCompanies: ["gOOgle"] }),
      mentor({ currentCompany: "Google" }),
    );
    expect(match.score).toBeGreaterThanOrEqual(40);
  });

  it("credits a domain match", () => {
    const match = scoreMentorForCandidate(
      candidate({ preferredDomains: ["Fintech"] }),
      mentor({ domain: "Fintech" }),
    );
    expect(match.reasons.join(" ")).toContain("Fintech");
  });

  it("gives verified mentors an edge over identical unverified ones", () => {
    const base = { currentCompany: "Acme", domain: "SaaS", yearsExperience: 5 };
    const verified = scoreMentorForCandidate(candidate(), mentor({ ...base, verificationStatus: "VERIFIED" }));
    const pending = scoreMentorForCandidate(candidate(), mentor({ ...base, verificationStatus: "PENDING" }));
    expect(verified.score).toBeGreaterThan(pending.score);
  });

  it("caps the help-company bonus so a long list cannot dominate", () => {
    const many = scoreMentorForCandidate(
      candidate({ targetCompanies: ["A", "B", "C", "D", "E", "F"] }),
      mentor({ helpCompanies: ["A", "B", "C", "D", "E", "F"] }),
    );
    const few = scoreMentorForCandidate(
      candidate({ targetCompanies: ["A", "B", "C"] }),
      mentor({ helpCompanies: ["A", "B", "C"] }),
    );
    expect(many.score).toBe(few.score);
  });
});

describe("rankMentorsForCandidate", () => {
  it("returns the best match first", () => {
    const target = mentor({ id: "target", currentCompany: "Google" });
    const unrelated = mentor({ id: "unrelated", currentCompany: "Nowhere" });
    const ranked = rankMentorsForCandidate(candidate({ targetCompanies: ["Google"] }), [unrelated, target]);
    expect(ranked[0].mentor.id).toBe("target");
  });

  it("breaks ties by experience", () => {
    const senior = mentor({ id: "senior", yearsExperience: 12 });
    const junior = mentor({ id: "junior", yearsExperience: 11 });
    const ranked = rankMentorsForCandidate(candidate(), [junior, senior]);
    expect(ranked[0].mentor.id).toBe("senior");
  });

  it("returns every mentor it was given", () => {
    const mentors = [mentor({ id: "a" }), mentor({ id: "b" }), mentor({ id: "c" })];
    expect(rankMentorsForCandidate(candidate(), mentors)).toHaveLength(3);
  });

  it("handles an empty mentor pool", () => {
    expect(rankMentorsForCandidate(candidate(), [])).toEqual([]);
  });
});
