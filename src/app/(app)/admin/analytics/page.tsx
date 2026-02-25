"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface WeeklyCount {
  [key: string]: string | number;
  week: string;
  count: number;
}

interface WeeklyRevenue {
  [key: string]: string | number;
  week: string;
  totalCents: number;
}

interface TopClub {
  name: string;
  city: string;
  gameCount: number;
}

interface AnalyticsData {
  signupsPerWeek: WeeklyCount[];
  revenuePerWeek: WeeklyRevenue[];
  gamesPerWeek: WeeklyCount[];
  activeUsers: number;
  retentionRate: number;
  totalRevenueCents: number;
  topClubs: TopClub[];
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ── Bar Chart (CSS-only) ─────────────────────────────────── */
function BarChart<T extends { [key: string]: unknown }>({
  data,
  labelKey,
  valueKey,
  formatValue,
  color = "#0B4F6C",
}: {
  data: T[];
  labelKey: keyof T & string;
  valueKey: keyof T & string;
  formatValue: (v: number) => string;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[#64748B] py-8 text-center">
        No data available for this period.
      </p>
    );
  }

  const values = data.map((d) => Number(d[valueKey]));
  const maxVal = Math.max(...values, 1);

  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const pct = (val / maxVal) * 100;
        const label =
          labelKey === "week"
            ? formatWeekLabel(d[labelKey] as string)
            : String(d[labelKey]);

        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-[#64748B] w-16 text-right shrink-0 font-[family-name:var(--font-inter)]">
              {label}
            </span>
            <div className="flex-1 h-7 bg-[#F1F5F9] rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(pct, val > 0 ? 2 : 0)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="text-xs font-medium text-[#333333] w-16 shrink-0 font-[family-name:var(--font-inter)]">
              {formatValue(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Loading skeleton ─────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-[#E2E8F0] rounded-xl p-6">
            <div className="h-3 w-24 bg-[#E2E8F0] rounded mb-3" />
            <div className="h-8 w-20 bg-[#E2E8F0] rounded" />
          </Card>
        ))}
      </div>

      {/* Chart placeholders */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-[#E2E8F0] rounded-xl p-6">
          <div className="h-4 w-40 bg-[#E2E8F0] rounded mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-3 w-16 bg-[#E2E8F0] rounded" />
                <div className="flex-1 h-7 bg-[#F1F5F9] rounded" />
                <div className="h-3 w-12 bg-[#E2E8F0] rounded" />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Table placeholder */}
      <Card className="border-[#E2E8F0] rounded-xl p-6">
        <div className="h-4 w-48 bg-[#E2E8F0] rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="h-6 bg-[#F1F5F9] rounded" />
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Card className="border-[#E2E8F0] rounded-xl p-6">
        <p className="text-red-600 text-sm">Failed to load analytics: {error}</p>
      </Card>
    );
  }

  if (!data) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] rounded-xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8F4F8] flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-[#0B4F6C]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </div>
          <p className="text-2xl font-light text-[#0A0A0A]">
            {data.activeUsers.toLocaleString()}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Active Users (30d)</p>
        </Card>

        <Card className="border-[#E2E8F0] rounded-xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-[#0B4F6C]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
              />
            </svg>
          </div>
          <p className="text-2xl font-light text-[#0A0A0A]">{data.retentionRate}%</p>
          <p className="text-xs text-[#64748B] mt-1">Retention Rate</p>
        </Card>

        <Card className="border-[#E2E8F0] rounded-xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8F4F8] flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-[#0B4F6C]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
              />
            </svg>
          </div>
          <p className="text-2xl font-light text-[#0A0A0A]">
            {formatCurrency(data.totalRevenueCents)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Total Revenue (12wk)</p>
        </Card>
      </div>

      {/* ── Signups Chart ──────────────────────────────── */}
      <Card className="border-[#E2E8F0] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] tracking-wide mb-4">
          Signups per Week
        </h2>
        <BarChart
          data={data.signupsPerWeek}
          labelKey="week"
          valueKey="count"
          formatValue={(v) => v.toLocaleString()}
          color="#0B4F6C"
        />
      </Card>

      {/* ── Revenue Chart ──────────────────────────────── */}
      <Card className="border-[#E2E8F0] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] tracking-wide mb-4">
          Revenue per Week
        </h2>
        <BarChart
          data={data.revenuePerWeek}
          labelKey="week"
          valueKey="totalCents"
          formatValue={(v) => formatCurrency(v)}
          color="#16a34a"
        />
      </Card>

      {/* ── Games Chart ────────────────────────────────── */}
      <Card className="border-[#E2E8F0] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] tracking-wide mb-4">
          Games per Week
        </h2>
        <BarChart
          data={data.gamesPerWeek}
          labelKey="week"
          valueKey="count"
          formatValue={(v) => v.toLocaleString()}
          color="#7c3aed"
        />
      </Card>

      {/* ── Top Clubs Table ────────────────────────────── */}
      <Card className="border-[#E2E8F0] rounded-xl p-6">
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] tracking-wide mb-4">
          Top Clubs by Game Count
        </h2>
        {data.topClubs.length === 0 ? (
          <p className="text-sm text-[#64748B] py-4 text-center">
            No club data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[#64748B] uppercase tracking-wider font-[family-name:var(--font-inter)]">
                    Club
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[#64748B] uppercase tracking-wider font-[family-name:var(--font-inter)]">
                    City
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-[#64748B] uppercase tracking-wider font-[family-name:var(--font-inter)]">
                    Games
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topClubs.map((club, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#E2E8F0] last:border-b-0"
                  >
                    <td className="py-3 pr-4 text-[#333333] font-[family-name:var(--font-inter)]">
                      {club.name}
                    </td>
                    <td className="py-3 pr-4 text-[#64748B] font-[family-name:var(--font-inter)]">
                      {club.city}
                    </td>
                    <td className="py-3 text-right font-medium text-[#0B4F6C] font-[family-name:var(--font-inter)]">
                      {club.gameCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
