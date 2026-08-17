import { VerificationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  hasIdentityChanged,
  isMentorRequestable,
  requestableVerificationStatuses,
  shouldResetVerification,
  verificationLabel,
} from "@/domain/verification";

const identity = {
  currentCompany: "Google",
  designation: "Staff Engineer",
  yearsExperience: 11,
  domain: "SaaS",
};

describe("isMentorRequestable", () => {
  it("allows verified and pending mentors to receive requests", () => {
    expect(isMentorRequestable(VerificationStatus.VERIFIED)).toBe(true);
    expect(isMentorRequestable(VerificationStatus.PENDING)).toBe(true);
  });

  it("removes rejected mentors from the supply side", () => {
    expect(isMentorRequestable(VerificationStatus.REJECTED)).toBe(false);
  });

  it("keeps the exported status list and the predicate in agreement", () => {
    for (const status of Object.values(VerificationStatus)) {
      expect(requestableVerificationStatuses.includes(status)).toBe(isMentorRequestable(status));
    }
  });
});

describe("hasIdentityChanged", () => {
  it("is false when nothing changed", () => {
    expect(hasIdentityChanged(identity, { ...identity })).toBe(false);
  });

  it.each([
    ["currentCompany", { currentCompany: "Unverified Consulting" }],
    ["designation", { designation: "Chief Everything" }],
    ["yearsExperience", { yearsExperience: 40 }],
    ["domain", { domain: "Fintech" }],
  ])("detects a change to %s", (_field, patch) => {
    expect(hasIdentityChanged(identity, { ...identity, ...patch })).toBe(true);
  });
});

describe("shouldResetVerification", () => {
  it("sends a verified mentor back to review after an identity rewrite", () => {
    expect(
      shouldResetVerification(VerificationStatus.VERIFIED, identity, {
        ...identity,
        currentCompany: "Somewhere Else",
      }),
    ).toBe(true);
  });

  it("leaves a verified mentor verified when only presentation changed", () => {
    // bio, LinkedIn and helpCompanies are not part of the identity tuple, so an
    // edit to them never reaches this check with a difference.
    expect(shouldResetVerification(VerificationStatus.VERIFIED, identity, { ...identity })).toBe(false);
  });

  it("does not let a rejected mentor edit their way back into the queue", () => {
    expect(
      shouldResetVerification(VerificationStatus.REJECTED, identity, {
        ...identity,
        currentCompany: "Fresh Start Inc",
      }),
    ).toBe(false);
  });

  it("does nothing for a mentor already pending", () => {
    expect(
      shouldResetVerification(VerificationStatus.PENDING, identity, {
        ...identity,
        domain: "Fintech",
      }),
    ).toBe(false);
  });
});

describe("verificationLabel", () => {
  it("labels every status without falling through to a blank string", () => {
    for (const status of Object.values(VerificationStatus)) {
      expect(verificationLabel(status)).toBeTruthy();
    }
  });

  it("describes pending as awaiting review rather than as a failure", () => {
    expect(verificationLabel(VerificationStatus.PENDING)).toBe("Pending review");
  });
});
