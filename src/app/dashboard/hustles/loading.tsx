import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function HustlesLoading() {
  return <DashboardSkeleton metrics={0} rows={3} />;
}
