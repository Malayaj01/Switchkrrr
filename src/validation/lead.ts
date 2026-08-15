import { LeadStatus, Priority } from "@prisma/client";
import { z } from "zod";

const optionalText = (max = 240) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalUrl = z.url("Enter a valid URL.").optional().or(z.literal(""));

export const leadCreateSchema = z.object({
  company: z.string().trim().min(2, "Company is required.").max(120),
  role: z.string().trim().min(2, "Role is required.").max(140),
  domain: optionalText(100),
  location: optionalText(120),
  jobLink: optionalUrl,
  applicationLink: optionalUrl,
  contactName: optionalText(120),
  contactEmail: z.email("Enter a valid contact email.").optional().or(z.literal("")),
  priority: z.enum(Priority).default(Priority.MEDIUM),
  mentorComment: optionalText(1000),
  followUpDate: z.string().optional().or(z.literal("")),
});

export const leadStatusUpdateSchema = z.object({
  status: z.enum(LeadStatus),
  note: z.string().trim().max(1000, "Note must be under 1000 characters.").optional().or(z.literal("")),
  candidateComment: z.string().trim().max(1000, "Comment must be under 1000 characters.").optional().or(z.literal("")),
});

