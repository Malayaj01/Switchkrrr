import type { MentorProfile } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { anonymizeDesignation, toCompanyType, toMentorPreview } from "@/domain/mentor-preview";

function mentor(overrides: Partial<MentorProfile> = {}) {
  return {
    id: "mentor-1",
    userId: "user-1",
    currentCompany: "Google",
    designation: "Staff Software Engineer",
    yearsExperience: 11,
    domain: "SaaS",
    linkedinUrl: "https://linkedin.com/in/someone",
    bio: "Private bio text",
    helpCompanies: ["Google", "Microsoft", "Atlassian", "Freshworks"],
    mentorCode: "SWK-SECRET-01",
    verificationStatus: "VERIFIED",
    verificationNote: "Checked work email",
    verifiedAt: new Date(),
    verifiedById: "admin-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as MentorProfile;
}

/**
 * The candidate-facing preview is a privacy boundary, not just a view model.
 * These tests exist so that adding a field to MentorProfile cannot silently
 * expose it to candidates who have not been approved yet.
 */
describe("toMentorPreview", () => {
  const preview = toMentorPreview({ mentor: mentor(), score: 55, reasons: ["Works at Google"] }, null);

  // `designation` is intentionally present but anonymised, so it is asserted
  // separately below rather than listed here.
  it.each([
    "currentCompany",
    "linkedinUrl",
    "bio",
    "mentorCode",
    "userId",
    "verificationNote",
    "verifiedById",
    "verifiedAt",
  ])("never exposes %s", (field) => {
    expect(preview).not.toHaveProperty(field);
  });

  it("exposes exactly the agreed public keys and nothing else", () => {
    expect(Object.keys(preview).sort()).toEqual(
      [
        "companySignal",
        "currentCompanyType",
        "designation",
        "domain",
        "experienceRange",
        "id",
        "reasons",
        "requestStatus",
        "score",
        "verificationStatus",
      ].sort(),
    );
  });

  it("replaces the real designation with an anonymised role", () => {
    expect(preview.designation).toBe("Engineering mentor");
    expect(preview.designation).not.toContain("Staff");
  });

  it("replaces the exact company with a category", () => {
    expect(preview.currentCompanyType).toBe("Big Tech");
    expect(JSON.stringify(preview)).not.toContain("Staff Software Engineer");
  });

  it("buckets experience instead of giving the exact number", () => {
    expect(preview.experienceRange).toBe("10+ years");
  });

  it("limits the company signal to three entries", () => {
    expect(preview.companySignal).toHaveLength(3);
  });

  it("carries the request status through untouched", () => {
    expect(toMentorPreview({ mentor: mentor(), score: 1, reasons: [] }, "PENDING").requestStatus).toBe(
      "PENDING",
    );
  });
});

describe("anonymizeDesignation", () => {
  it.each([
    ["Engineering Manager", "Leadership mentor"],
    ["Head of Product", "Leadership mentor"],
    ["Senior Product Manager", "Leadership mentor"],
    ["Product Designer", "Product mentor"],
    ["Backend Developer", "Engineering mentor"],
    ["Principal Architect", "Engineering mentor"],
    ["Business Analyst", "Career mentor"],
  ])("maps %s to %s", (input, expected) => {
    expect(anonymizeDesignation(input)).toBe(expected);
  });

  it("always returns one of the four fixed buckets", () => {
    const buckets = ["Leadership mentor", "Product mentor", "Engineering mentor", "Career mentor"];
    expect(buckets).toContain(anonymizeDesignation("Something Completely Unheard Of"));
  });
});

describe("toCompanyType", () => {
  it.each([
    ["Google", "Big Tech"],
    ["Microsoft", "Big Tech"],
    ["Razorpay", "Fintech"],
    ["Stripe", "Fintech"],
    ["Swiggy", "Consumer internet"],
    ["Some Tiny Startup", "Growth company"],
  ])("categorises %s as %s", (input, expected) => {
    expect(toCompanyType(input)).toBe(expected);
  });

  it("never echoes back an unrecognised company name", () => {
    expect(toCompanyType("Very Identifiable Ltd")).not.toContain("Identifiable");
  });
});
