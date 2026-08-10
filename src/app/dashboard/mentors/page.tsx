import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MentorPreviewCard, type MentorPreview } from "@/components/mentor/mentor-preview-card";
import { rankMentorsForCandidate } from "@/domain/matching";
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
    },
  });

  const mentors = await prisma.mentorProfile.findMany({
    where: { userId: { not: user.id } },
  });

  const requestByMentorId = new Map(candidate.mentorRequests.map((request) => [request.mentorId, request.status]));
  const previews: MentorPreview[] = rankMentorsForCandidate(candidate, mentors).map(({ mentor, score, reasons }) => ({
    id: mentor.id,
    domain: mentor.domain,
    designation: anonymizeDesignation(mentor.designation),
    experienceRange: toExperienceRange(mentor.yearsExperience),
    companySignal: mentor.helpCompanies.slice(0, 3),
    currentCompanyType: toCompanyType(mentor.currentCompany),
    verificationStatus: mentor.verificationStatus,
    score,
    reasons,
    requestStatus: requestByMentorId.get(mentor.id) ?? null,
  }));

  return (
    <main className="shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Mentor matching</p>
          <h1>Recommended mentors</h1>
          <p className="muted">
            These previews hide private mentor details until your request is approved.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
      </header>

      {!candidate.profileCompletedAt && (
        <section className="dashboard-panel card">
          <h2>Complete profile first</h2>
          <p className="muted">Mentor requests are enabled after your candidate profile has the required matching details.</p>
          <Link className="button" href="/dashboard/profile">
            Complete profile
          </Link>
        </section>
      )}

      <section className="mentor-preview-grid">
        {previews.length > 0 ? (
          previews.map((mentor) => (
            <MentorPreviewCard key={mentor.id} canRequest={Boolean(candidate.profileCompletedAt)} mentor={mentor} />
          ))
        ) : (
          <article className="dashboard-panel card">
            <h2>No mentors yet</h2>
            <p className="muted">Add mentor seed data or onboard mentors to see recommendations here.</p>
          </article>
        )}
      </section>
    </main>
  );
}

function anonymizeDesignation(designation: string) {
  if (/manager|lead|head/i.test(designation)) return "Leadership mentor";
  if (/product/i.test(designation)) return "Product mentor";
  if (/engineer|developer|architect/i.test(designation)) return "Engineering mentor";
  return "Career mentor";
}

function toExperienceRange(years: number) {
  if (years >= 10) return "10+ years";
  if (years >= 7) return "7-9 years";
  if (years >= 4) return "4-6 years";
  return "0-3 years";
}

function toCompanyType(company: string) {
  if (/google|microsoft|amazon|meta|apple/i.test(company)) return "Big Tech";
  if (/razorpay|phonepe|paytm|stripe/i.test(company)) return "Fintech";
  if (/swiggy|zomato|zepto|meesho/i.test(company)) return "Consumer internet";
  return "Growth company";
}
