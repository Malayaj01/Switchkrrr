import { UserRole } from "@prisma/client";
import { requestableVerificationStatuses } from "@/domain/verification";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";
import { rankMentorsForCandidate } from "@/domain/matching";
import { toMentorPreview } from "@/domain/mentor-preview";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated.", 401);
  if (user.role !== UserRole.CANDIDATE) return fail("Only candidates can view mentor recommendations.", 403);

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    include: {
      mentorRequests: {
        select: {
          mentorId: true,
          status: true,
        },
      },
    },
  });
  if (!candidate) return fail("Candidate profile not found.", 404);

  const mentors = await prisma.mentorProfile.findMany({
    where: {
      userId: { not: user.id },
      // Rejected mentors are removed from the supply side entirely.
      verificationStatus: { in: requestableVerificationStatuses },
    },
  });

  const requestByMentorId = new Map(candidate.mentorRequests.map((request) => [request.mentorId, request.status]));
  const rankedMentors = rankMentorsForCandidate(candidate, mentors).map((match) =>
    toMentorPreview(match, requestByMentorId.get(match.mentor.id) ?? null),
  );

  return ok({ mentors: rankedMentors });
}
