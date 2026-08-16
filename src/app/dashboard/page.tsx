import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CandidateDashboard } from "@/components/dashboard/candidate-dashboard";
import { MentorDashboard } from "@/components/dashboard/mentor-dashboard";
import { getCurrentUser } from "@/lib/security/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard name={user.name} />;
  }

  if (user.role === UserRole.MENTOR) {
    return <MentorDashboard name={user.name} userId={user.id} />;
  }

  return <CandidateDashboard name={user.name} userId={user.id} />;
}
