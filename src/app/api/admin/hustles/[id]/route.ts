import { HustleStatus, UserRole, VerificationStatus } from "@prisma/client";
import { z } from "zod";
import { platformLimits } from "@/domain/limits";
import { ApiError, fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

const reassignSchema = z.object({
  mentorId: z.string().min(1, "Choose a mentor to reassign to."),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Moves a Hustle owned by a rejected mentor to a verified one. This is the only
 * way an admin can rescue candidates whose mentor was removed from the platform.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.ADMIN) return fail("Only admins can reassign Hustles.", 403);

    const { id } = await context.params;
    const { mentorId } = reassignSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const hustle = await tx.hustle.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          candidateId: true,
          mentorId: true,
          mentor: { select: { verificationStatus: true } },
        },
      });
      if (!hustle) throw new ApiError("Hustle not found.", 404);

      if (hustle.mentor.verificationStatus !== VerificationStatus.REJECTED) {
        throw new ApiError("Only Hustles owned by a rejected mentor can be reassigned.", 409);
      }
      if (hustle.mentorId === mentorId) {
        throw new ApiError("That is already this Hustle's mentor.", 409);
      }

      const mentor = await tx.mentorProfile.findUnique({
        where: { id: mentorId },
        select: { id: true, verificationStatus: true },
      });
      if (!mentor) throw new ApiError("Mentor not found.", 404);
      if (mentor.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new ApiError("Hustles can only be reassigned to a verified mentor.", 409);
      }

      // Hustle has a unique constraint on (candidateId, mentorId), so a candidate
      // cannot end up with two Hustles under the same mentor. Check it here to
      // return a useful message instead of surfacing a constraint violation.
      const duplicate = await tx.hustle.findFirst({
        where: { candidateId: hustle.candidateId, mentorId, id: { not: hustle.id } },
        select: { id: true, status: true },
      });
      if (duplicate) {
        throw new ApiError(
          "This candidate already has a Hustle with that mentor. Pick a different mentor.",
          409,
        );
      }

      if (hustle.status === HustleStatus.ACTIVE) {
        const mentorActive = await tx.hustle.count({
          where: { mentorId, status: HustleStatus.ACTIVE },
        });
        if (mentorActive >= platformLimits.maxActiveHustlesPerMentor) {
          throw new ApiError("That mentor is already at the active candidate limit.", 409);
        }
      }

      return tx.hustle.update({
        where: { id },
        data: { mentorId },
        select: { id: true, mentorId: true, status: true, updatedAt: true },
      });
    });

    return ok({ hustle: result });
  } catch (error) {
    return handleRouteError(error);
  }
}
