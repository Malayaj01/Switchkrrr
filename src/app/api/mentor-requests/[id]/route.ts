import { MentorRequestStatus, UserRole } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { platformLimits } from "@/domain/limits";
import { mentorRequestDecisionSchema } from "@/validation/mentor-request";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.MENTOR) return fail("Only mentors can decide requests.", 403);

    const { id } = await context.params;
    const payload = mentorRequestDecisionSchema.parse(await request.json());

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
      include: {
        hustles: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });
    if (!mentor) return fail("Mentor profile not found.", 404);
    if (
      payload.decision === MentorRequestStatus.APPROVED &&
      mentor.hustles.length >= platformLimits.maxActiveHustlesPerMentor
    ) {
      return fail("You have reached the active candidate limit.", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const mentorRequest = await tx.mentorRequest.findUnique({
        where: { id },
      });

      if (!mentorRequest) {
        throw new DecisionError("Mentor request not found.", 404);
      }

      if (mentorRequest.mentorId !== mentor.id) {
        throw new DecisionError("You can only decide requests assigned to you.", 403);
      }

      if (mentorRequest.status !== MentorRequestStatus.PENDING) {
        throw new DecisionError("Only pending requests can be approved or declined.", 400);
      }

      const updatedRequest = await tx.mentorRequest.update({
        where: { id },
        data: {
          status: payload.decision,
          mentorResponse: payload.mentorResponse || null,
        },
      });

      if (payload.decision === MentorRequestStatus.DECLINED) {
        return { mentorRequest: updatedRequest, hustle: null };
      }

      const hustle = await tx.hustle.upsert({
        where: {
          candidateId_mentorId: {
            candidateId: mentorRequest.candidateId,
            mentorId: mentorRequest.mentorId,
          },
        },
        update: {
          status: "ACTIVE",
          mentorRequestId: mentorRequest.id,
        },
        create: {
          candidateId: mentorRequest.candidateId,
          mentorId: mentorRequest.mentorId,
          mentorRequestId: mentorRequest.id,
        },
      });

      return { mentorRequest: updatedRequest, hustle };
    });

    return ok(result);
  } catch (error) {
    if (error instanceof DecisionError) {
      return fail(error.message, error.status);
    }

    return handleRouteError(error);
  }
}

class DecisionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

