"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { skillLabel } from "@/lib/constants";

interface SessionRow {
  id: string;
  date: string;
  startTime: string;
  durationMins: number;
  format: string;
  capacity: number;
  playersJoined: number;
  waitlistCount: number;
  fillPercent: number;
  status: string;
  skillLevel: number;
}

interface SessionTableProps {
  rows: SessionRow[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Full: "default",
  Filling: "secondary",
  Low: "outline",
  Cancelled: "destructive",
};

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentDir: string;
  onSort: (field: string) => void;
}) {
  const isActive = currentSort === field;
  const Icon = isActive
    ? currentDir === "asc"
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-[#0B4F6C] transition-colors"
    >
      {label}
      <Icon className="w-3 h-3" />
    </button>
  );
}

export function SessionTable({
  rows,
  total,
  page,
  pageSize,
  sortBy,
  sortDir,
}: SessionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || ""
  );

  const totalPages = Math.ceil(total / pageSize);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/club-admin/sessions?${params.toString()}`);
  }

  function handleSort(field: string) {
    const newDir = sortBy === field && sortDir === "desc" ? "asc" : "desc";
    updateParams({ sortBy: field, sortDir: newDir, page: "1" });
  }

  function handleStatusFilter(status: string) {
    setStatusFilter(status);
    updateParams({ status, page: "1" });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "Full", "Filling", "Low", "Cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              statusFilter === s
                ? "bg-[#0B4F6C] text-white border-[#0B4F6C]"
                : "border-[#E2E8F0] text-[#333333] hover:bg-[#E8F4F8]"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              <TableHead>
                <SortHeader
                  label="Date/Time"
                  field="startTime"
                  currentSort={sortBy}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead className="text-center">Capacity</TableHead>
              <TableHead className="text-center">
                <SortHeader
                  label="Joined"
                  field="playersJoined"
                  currentSort={sortBy}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-center">Fill %</TableHead>
              <TableHead className="text-center">Waitlist</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[#64748B] py-8">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm">
                    <div>{format(new Date(row.startTime), "MMM d, yyyy")}</div>
                    <div className="text-xs text-[#64748B]">
                      {format(new Date(row.startTime), "h:mm a")} ·{" "}
                      {row.durationMins}min
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.format}</TableCell>
                  <TableCell className="text-sm">
                    {skillLabel(row.skillLevel)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {row.capacity}
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium">
                    {row.playersJoined}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <span
                      className={`font-medium ${
                        row.fillPercent >= 100
                          ? "text-emerald-600"
                          : row.fillPercent >= 50
                            ? "text-amber-600"
                            : "text-red-500"
                      }`}
                    >
                      {row.fillPercent}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {row.waitlistCount > 0 ? row.waitlistCount : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status] || "outline"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#64748B]">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
