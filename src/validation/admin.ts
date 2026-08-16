import { VerificationStatus } from "@prisma/client";
import { z } from "zod";

export const mentorVerificationSchema = z.object({
  status: z.enum([VerificationStatus.VERIFIED, VerificationStatus.REJECTED, VerificationStatus.PENDING]),
  note: z
    .string()
    .trim()
    .max(500, "Verification note cannot be longer than 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type MentorVerificationInput = z.infer<typeof mentorVerificationSchema>;
