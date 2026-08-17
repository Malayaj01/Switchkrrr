import { HustleStatus, UserRole } from "@prisma/client";
import { canTransition, consumesCapacity, hustleStatusLabel } from "@/domain/hustle";
import { platformLimits } from "@/domain/limits";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { hustleStatusUpdateSchema } from "@/validation/hustle";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);

    const { id } = await context.params;
    const payload = hustleStatusUpdateSchema.parse(await request.json());

    const hustle = await prisma.hustle.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        candidateId: true,
        mentorId: true,
        candidate: { select: { userId: true } },
        mentor: { select: { userId: true } },
      },
    });
    if (!hustle) return fail("Hustle not found.", 404);

    // Either participant can change the status of their own Hustle; an admin
    // can act on any Hustle, which is how a rejected mentor's work gets paused.
    const isParticipant =
      hustle.candidate.userId === user.id || hustle.mentor.userId === user.id;
    if (!isParticipant && user.role !== UserRole.ADMIN) {
      return fail("You can only update your own Hustles.", 403);
    }

    if (hustle.status === payload.status) {
      return fail(`This Hustle is already ${hustleStatusLabel(payload.status).toLowerCase()}.`, 409);
    }

    if (!canTransition(hustle.status, payload.status)) {
      return fail(
        `Cannot move a ${hustleStatusLabel(hustle.status).toLowerCase()} Hustle to ${hustleStatusLabel(payload.status).toLowerCase()}.`,
        400,
      );
    }

    // Reopening consumes a slot again, so both caps have to be re-checked or
    // pause/reopen becomes a way around the limits entirely.
    if (consumesCapacity(payload.status)) {
      const [candidateActive, mentorActive] = await Promise.all([
        prisma.hustle.count({
          where: { candidateId: hustle.candidateId, status: HustleStatus.ACTIVE },
        }),
        prisma.hustle.count({
          where: { mentorId: hustle.mentorId, status: HustleStatus.ACTIVE },
        }),
      ]);

      if (candidateActive >= platformLimits.maxActiveHustlesPerCandidate) {
        return fail(
          `The candidate already has ${platformLimits.maxActiveHustlesPerCandidate} active Hustles.`,
          409,
        );
      }
      if (mentorActive >= platformLimits.maxActiveHustlesPerMentor) {
        return fail(
          `The mentor already has ${platformLimits.maxActiveHustlesPerMentor} active candidates.`,
          409,
        );
      }
    }

    const updated = await prisma.hustle.update({
      where: { id },
      data: { status: payload.status },
      select: { id: true, status: true, updatedAt: true },
    });

    return ok({ hustle: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
