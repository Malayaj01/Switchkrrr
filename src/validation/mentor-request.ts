import { z } from "zod";

export const mentorRequestSchema = z.object({
  mentorId: z.string().min(1, "Mentor is required."),
  candidateMessage: z.string().trim().max(800, "Message must be under 800 characters.").optional().or(z.literal("")),
});

export const mentorRequestDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "DECLINED"]),
  mentorResponse: z.string().trim().max(800, "Response must be under 800 characters.").optional().or(z.literal("")),
});
