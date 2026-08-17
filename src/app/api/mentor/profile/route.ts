import { UserRole, VerificationStatus } from "@prisma/client";
import { shouldResetVerification, verificationResetNote } from "@/domain/verification";
import { ApiError, fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { mentorProfileSchema } from "@/validation/mentor-profile";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.MENTOR) return fail("Only mentors can update this profile.", 403);

    const payload = mentorProfileSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.mentorProfile.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          verificationStatus: true,
          currentCompany: true,
          designation: true,
          yearsExperience: true,
          domain: true,
        },
      });
      if (!existing) throw new ApiError("Mentor profile not found.", 404);

      const resetVerification = shouldResetVerification(existing.verificationStatus, existing, payload);

      const profile = await tx.mentorProfile.update({
        where: { id: existing.id },
        data: {
          currentCompany: payload.currentCompany,
          designation: payload.designation,
          yearsExperience: payload.yearsExperience,
          domain: payload.domain,
          linkedinUrl: payload.linkedinUrl || null,
          bio: payload.bio || null,
          helpCompanies: payload.helpCompanies,
          ...(resetVerification
            ? {
                verificationStatus: VerificationStatus.PENDING,
                verificationNote: verificationResetNote,
                verifiedAt: null,
                verifiedById: null,
              }
            : {}),
        },
        select: {
          id: true,
          currentCompany: true,
          designation: true,
          yearsExperience: true,
          domain: true,
          linkedinUrl: true,
          bio: true,
          helpCompanies: true,
          verificationStatus: true,
        },
      });

      return { profile, resetVerification };
    });

    return ok({
      profile: result.profile,
      // Surfaced so the form can tell the mentor why their badge disappeared.
      verificationReset: result.resetVerification,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
