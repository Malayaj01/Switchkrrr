import { z } from "zod";

const listItem = z.string().trim().min(1).max(120);

export const mentorProfileSchema = z.object({
  currentCompany: z.string().trim().min(2, "Current company is required.").max(120),
  designation: z.string().trim().min(2, "Designation is required.").max(120),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  domain: z.string().trim().min(2, "Domain is required.").max(80),
  linkedinUrl: z.string().trim().url("Enter a valid LinkedIn URL.").optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  helpCompanies: z.array(listItem).max(50),
});

export type MentorProfileInput = z.infer<typeof mentorProfileSchema>;
