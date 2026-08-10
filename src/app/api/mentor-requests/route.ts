import { UserRole } from "@prisma/client";
import { fail, handleRouteError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { platformLimits } from "@/domain/limits";
import { mentorRequestSchema } from "@/validation/mentor-request";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Not authenticated.", 401);
    if (user.role !== UserRole.CANDIDATE) return fail("Only candidates can send mentor requests.", 403);

    const payload = mentorRequestSchema.parse(await request.json());
    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      include: {
        mentorRequests: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
    });

    if (!candidate) return fail("Candidate profile not found.", 404);
    if (!candidate.profileCompletedAt) return fail("Complete your candidate profile before requesting mentors.", 400);
    if (candidate.mentorRequests.length >= platformLimits.maxPendingMentorRequestsPerCandidate) {
      return fail("You have reached the pending mentor request limit.", 400);
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: payload.mentorId },
      select: { id: true },
    });
    if (!mentor) return fail("Mentor not found.", 404);

    const mentorRequest = await prisma.mentorRequest.create({
      data: {
        candidateId: candidate.id,
        mentorId: mentor.id,
        candidateMessage: payload.candidateMessage || null,
      },
    });

    return ok({ mentorRequest }, 201);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return fail("You already have a request with this mentor.", 409);
    }

    return handleRouteError(error);
  }
}

function isUniqueConstraintError(error: unknown) {
  return error && typeof error === "object" && "code" in error && error.code === "P2002";
}

