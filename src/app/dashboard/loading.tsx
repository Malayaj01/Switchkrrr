import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function DashboardLoading() {
  return <DashboardSkeleton metrics={4} rows={3} />;
}
