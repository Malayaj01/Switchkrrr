import { z } from "zod";

const listItem = z.string().trim().min(1).max(80);

export const candidateProfileSchema = z
  .object({
    currentCompany: z.string().trim().min(2, "Current company is required.").max(120),
    designation: z.string().trim().min(2, "Designation is required.").max(120),
    goalRole: z.string().trim().min(2, "Goal role is required.").max(120),
    targetTimeline: z.string().optional().or(z.literal("")),
    resumeText: z.string().trim().max(12000).optional().or(z.literal("")),
    skills: z.array(listItem).max(40),
    preferredLocations: z.array(listItem).max(20),
    expectedSalaryMin: z.coerce.number().int().min(0).max(100000000).optional().nullable(),
    expectedSalaryMax: z.coerce.number().int().min(0).max(100000000).optional().nullable(),
    targetCompanies: z.array(listItem).max(50),
    preferredDomains: z.array(listItem).max(30),
    jobTypePreference: z.enum(["REMOTE", "HYBRID", "ONSITE", "FLEXIBLE"]).optional().nullable(),
  })
  .refine(
    (profile) =>
      !profile.expectedSalaryMin ||
      !profile.expectedSalaryMax ||
      profile.expectedSalaryMin <= profile.expectedSalaryMax,
    {
      message: "Minimum salary cannot be greater than maximum salary.",
      path: ["expectedSalaryMin"],
    },
  );

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;

export function isCandidateProfileComplete(profile: CandidateProfileInput) {
  return Boolean(
    profile.currentCompany &&
      profile.designation &&
      profile.goalRole &&
      profile.skills.length > 0 &&
      profile.preferredLocations.length > 0 &&
      profile.targetCompanies.length > 0 &&
      profile.preferredDomains.length > 0 &&
      profile.jobTypePreference,
  );
}

