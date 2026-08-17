import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function AdminLoading() {
  return <DashboardSkeleton metrics={4} rows={4} />;
}
