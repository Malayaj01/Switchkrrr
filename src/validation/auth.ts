import { UserRole } from "@prisma/client";
import { z } from "zod";

const username = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be at most 32 characters.")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.");

const password = z.string().min(8, "Password must be at least 8 characters.");

export const signupSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal(UserRole.MENTOR),
    name: z.string().trim().min(2),
    username,
    email: z.email().toLowerCase(),
    password,
    currentCompany: z.string().trim().min(2),
    designation: z.string().trim().min(2),
    yearsExperience: z.coerce.number().int().min(0).max(60),
    domain: z.string().trim().min(2),
    linkedinUrl: z.url().optional().or(z.literal("")),
    helpCompanies: z.array(z.string().trim()).default([]),
  }),
  z.object({
    role: z.literal(UserRole.CANDIDATE),
    name: z.string().trim().min(2),
    username,
    email: z.email().toLowerCase(),
    password,
    currentCompany: z.string().trim().min(2),
    designation: z.string().trim().min(2),
    goalRole: z.string().trim().min(2),
    targetTimeline: z.string().optional(),
  }),
]);

export const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(3),
  password: z.string().min(1),
});
