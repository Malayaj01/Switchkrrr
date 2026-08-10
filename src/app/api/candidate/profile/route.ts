import { UserRole } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { candidateProfileSchema, isCandidateProfileComplete } from "@/validation/candidate-profile";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated.", 401);
  if (user.role !== UserRole.CANDIDATE) return fail("Only candidates can access this profile.", 403);

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) return fail("Candidate profile not found.", 404);

  return ok({ profile });
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.CANDIDATE) return fail("Only candidates can update this profile.", 403);

    const payload = candidateProfileSchema.parse(await request.json());
    const profileCompletedAt = isCandidateProfileComplete(payload) ? new Date() : null;

    const profile = await prisma.candidateProfile.update({
      where: { userId: user.id },
      data: {
        currentCompany: payload.currentCompany,
        designation: payload.designation,
        goalRole: payload.goalRole,
        targetTimeline: payload.targetTimeline ? new Date(payload.targetTimeline) : null,
        resumeText: payload.resumeText || null,
        skills: payload.skills,
        preferredLocations: payload.preferredLocations,
        expectedSalaryMin: payload.expectedSalaryMin || null,
        expectedSalaryMax: payload.expectedSalaryMax || null,
        targetCompanies: payload.targetCompanies,
        preferredDomains: payload.preferredDomains,
        jobTypePreference: payload.jobTypePreference || null,
        profileCompletedAt,
      },
    });

    return ok({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

