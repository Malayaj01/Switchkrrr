import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell, EmptyState, Panel } from "@/components/dashboard/dashboard-shell";
import { MentorPreviewCard } from "@/components/mentor/mentor-preview-card";
import { platformLimits } from "@/domain/limits";
import { rankMentorsForCandidate } from "@/domain/matching";
import { toMentorPreview, type MentorPreview } from "@/domain/mentor-preview";
import { requestableVerificationStatuses } from "@/domain/verification";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

export default async function RecommendedMentorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.CANDIDATE) redirect("/dashboard");

  const candidate = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      mentorRequests: {
        select: {
          mentorId: true,
          status: true,
        },
      },
      hustles: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  const mentors = await prisma.mentorProfile.findMany({
    where: {
      userId: { not: user.id },
      // Rejected mentors never appear in candidate-facing discovery.
      verificationStatus: { in: requestableVerificationStatuses },
    },
  });

  const requestByMentorId = new Map(candidate.mentorRequests.map((request) => [request.mentorId, request.status]));
  const previews: MentorPreview[] = rankMentorsForCandidate(candidate, mentors).map((match) =>
    toMentorPreview(match, requestByMentorId.get(match.mentor.id) ?? null),
  );

  const isProfileComplete = Boolean(candidate.profileCompletedAt);
  const atHustleLimit = candidate.hustles.length >= platformLimits.maxActiveHustlesPerCandidate;
  const canRequest = isProfileComplete && !atHustleLimit;

  return (
    <DashboardShell
      eyebrow="Mentor matching"
      role={UserRole.CANDIDATE}
      title="Recommended mentors"
      subtitle="These previews hide private mentor details until your request is approved."
    >
      {!isProfileComplete && (
        <Panel eyebrow="Blocked" title="Complete your profile first">
          <p className="muted">
            Mentor requests unlock once your candidate profile has the details matching depends on.
          </p>
          <div className="panel-actions">
            <Link className="button" href="/dashboard/profile">
              Complete profile
            </Link>
          </div>
        </Panel>
      )}

      {isProfileComplete && atHustleLimit && (
        <Panel eyebrow="At capacity" title="You have reached the active Hustle limit">
          <p className="muted">
            You can run {platformLimits.maxActiveHustlesPerCandidate} Hustles at a time. Complete one before
            requesting another mentor.
          </p>
          <div className="panel-actions">
            <Link className="button secondary" href="/dashboard/hustles">
              Open Hustles
            </Link>
          </div>
        </Panel>
      )}

      <section className="mentor-preview-grid">
        {previews.length > 0 ? (
          previews.map((mentor) => (
            <MentorPreviewCard canRequest={canRequest} key={mentor.id} mentor={mentor} />
          ))
        ) : (
          <Panel eyebrow="Matching" title="No mentors available yet">
            <EmptyState>
              No verified or pending mentors match your profile right now. Check back once more mentors join.
            </EmptyState>
          </Panel>
        )}
      </section>
    </DashboardShell>
  );
}
