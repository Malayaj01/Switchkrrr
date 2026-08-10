import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CandidateProfileForm } from "@/components/candidate/profile-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security/session";

export default async function CandidateProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.CANDIDATE) redirect("/dashboard");

  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: user.id },
  });

  return (
    <main className="shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Profile setup</p>
          <h1>Complete your candidate profile</h1>
          <p className="muted">
            This information powers mentor matching, private mentor previews, and future Hustle recommendations.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
      </header>
      <CandidateProfileForm profile={profile} />
    </main>
  );
}

