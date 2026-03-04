import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClubForAdmin, getSessionUtilization } from "@/lib/club-analytics";
import { SessionTable } from "@/components/club-admin/session-table";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const club = await getClubForAdmin(session.user.id);
  if (!club) redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const sortBy = params.sortBy || "startTime";
  const sortDir = (params.sortDir === "asc" ? "asc" : "desc") as "asc" | "desc";
  const statusFilter = params.status || undefined;

  const { rows, total } = await getSessionUtilization(club.id, {
    page,
    pageSize: 20,
    sortBy,
    sortDir,
    statusFilter,
  });

  // Serialize dates for client component
  const serializedRows = rows.map((r) => ({
    ...r,
    date: r.date.toISOString(),
    startTime: r.startTime.toISOString(),
  }));

  // Underutilized slots callout
  const lowFillCount = rows.filter((r) => r.fillPercent < 50 && r.status !== "Cancelled").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-1">
          Session Utilization
        </h2>
        <p className="text-sm text-[#64748B]">
          Track how your court sessions are filling up
        </p>
      </div>

      {lowFillCount > 0 && (
        <Card className="bg-amber-50 border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {lowFillCount} session{lowFillCount !== 1 ? "s" : ""} below 50%
              fill rate
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Consider promoting underutilized time slots to boost attendance
            </p>
          </div>
        </Card>
      )}

      <SessionTable
        rows={serializedRows}
        total={total}
        page={page}
        pageSize={20}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
