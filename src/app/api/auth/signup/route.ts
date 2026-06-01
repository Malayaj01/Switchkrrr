import { UserRole } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { createSession } from "@/lib/security/session";
import { signupSchema } from "@/validation/auth";

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());
    const passwordHash = await hashPassword(payload.password);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { username: payload.username }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new Error("An account already exists with this email or username.");
    }

    const user = await prisma.user.create({
      data:
        payload.role === UserRole.MENTOR
          ? {
              role: UserRole.MENTOR,
              name: payload.name,
              username: payload.username,
              email: payload.email,
              passwordHash,
              mentorProfile: {
                create: {
                  currentCompany: payload.currentCompany,
                  designation: payload.designation,
                  yearsExperience: payload.yearsExperience,
                  domain: payload.domain,
                  linkedinUrl: payload.linkedinUrl || null,
                  helpCompanies: payload.helpCompanies,
                  mentorCode: makeMentorCode(),
                },
              },
            }
          : {
              role: UserRole.CANDIDATE,
              name: payload.name,
              username: payload.username,
              email: payload.email,
              passwordHash,
              candidateProfile: {
                create: {
                  currentCompany: payload.currentCompany,
                  designation: payload.designation,
                  goalRole: payload.goalRole,
                  targetTimeline: payload.targetTimeline ? new Date(payload.targetTimeline) : null,
                  skills: [],
                  preferredLocations: [],
                  targetCompanies: [],
                  preferredDomains: [],
                },
              },
            },
      include: {
        mentorProfile: true,
        candidateProfile: true,
      },
    });

    await createSession(user.id);

    return ok({ user: sanitizeUser(user) }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

function makeMentorCode() {
  return `SWK-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
