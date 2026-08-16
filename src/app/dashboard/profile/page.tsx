import { UserRole, VerificationStatus } from "@prisma/client";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { CandidateProfileForm } from "@/components/candidate/profile-form";
import { DashboardShell, Panel, SummaryItem } from "@/components/dashboard/dashboard-shell";
import { verificationChipClassName, verificationLabel } from "@/domain/verification";
import { formatDateTime, formatLongDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === UserRole.ADMIN) redirect("/dashboard");

  if (user.role === UserRole.MENTOR) {
    return <MentorProfile userId={user.id} />;
  }

  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
  });

  return (
    <DashboardShell
      eyebrow="Profile setup"
      role={UserRole.CANDIDATE}
      title="Complete your candidate profile"
      subtitle="This information powers mentor matching, private mentor previews and Hustle recommendations."
    >
      <CandidateProfileForm profile={profile} />
    </DashboardShell>
  );
}

async function MentorProfile({ userId }: { userId: string }) {
  const mentor = await prisma.mentorProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      verifiedBy: { select: { name: true } },
      _count: { select: { hustles: true, mentorRequests: true } },
    },
  });

  const isVerified = mentor.verificationStatus === VerificationStatus.VERIFIED;

  return (
    <DashboardShell
      eyebrow="Mentor profile"
      role={UserRole.MENTOR}
      title={mentor.user.name}
      subtitle={`${mentor.designation} at ${mentor.currentCompany}`}
      action={
        <span className={`request-status-chip ${verificationChipClassName(mentor.verificationStatus)}`}>
          <ShieldCheck size={15} />
          {verificationLabel(mentor.verificationStatus)}
        </span>
      }
    >
      <Panel
        eyebrow="Verification"
        title={isVerified ? "Your profile is verified" : verificationLabel(mentor.verificationStatus)}
      >
        <p className="muted">
          {mentor.verificationStatus === VerificationStatus.VERIFIED
            ? "Candidates see a verified badge on your preview, and verified mentors rank higher in matching."
            : mentor.verificationStatus === VerificationStatus.REJECTED
              ? "You are hidden from candidate recommendations and cannot receive new requests."
              : "An admin has not reviewed your profile yet. Candidates can still request you, but you are shown as unverified."}
        </p>
        {mentor.verificationNote && (
          <div className="message-block">
            <strong>Admin note</strong>
            <p className="muted">{mentor.verificationNote}</p>
          </div>
        )}
        {mentor.verifiedAt && (
          <p className="muted">
            Last reviewed {formatDateTime(mentor.verifiedAt)}
            {mentor.verifiedBy ? ` by ${mentor.verifiedBy.name}` : ""}.
          </p>
        )}
      </Panel>

      <Panel eyebrow="Details" title="Mentor profile">
        <div className="profile-summary-grid">
          <SummaryItem label="Years experience" value={mentor.yearsExperience} />
          <SummaryItem label="Active + past Hustles" value={mentor._count.hustles} />
          <SummaryItem label="Requests received" value={mentor._count.mentorRequests} />
          <SummaryItem label="Mentor code" value={mentor.mentorCode} />
        </div>

        <div className="request-detail-grid">
          <Field label="Email" value={mentor.user.email} />
          <Field label="Domain" value={mentor.domain} />
          <Field label="Joined" value={formatLongDate(mentor.user.createdAt)} />
          <Field label="LinkedIn" value={mentor.linkedinUrl ?? ""} />
        </div>

        {mentor.helpCompanies.length > 0 && (
          <div className="match-signals">
            {mentor.helpCompanies.map((company) => (
              <span key={company}>{company}</span>
            ))}
          </div>
        )}

        {mentor.bio && (
          <div className="message-block">
            <strong>Bio</strong>
            <p className="muted">{mentor.bio}</p>
          </div>
        )}

        <p className="muted">
          Mentor profile editing is not built yet. Ask an admin to update these details for now.
        </p>
      </Panel>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-item">
      <span className="info-label">{label}</span>
      <strong className="info-value">{value || "Not provided"}</strong>
    </div>
  );
}
