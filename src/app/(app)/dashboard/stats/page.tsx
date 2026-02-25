"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Star, MapPin, BarChart3, Users, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StatsData {
  playerName: string;
  totalGames: number;
  avgRating: number;
  ratingCount: number;
  ratingBreakdown: Record<number, number>;
  feltLevelBreakdown: Record<string, number>;
  gamesByMonth: { month: string; count: number }[];
  gamesWon: number;
  favoriteClub: string | null;
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-[#64748B]">Unable to load stats. Please try again later.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4 border-[#0B4F6C] text-[#0B4F6C] rounded-lg">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const maxMonthCount = Math.max(...stats.gamesByMonth.map((m) => m.count), 1);
  const maxRatingCount = Math.max(...Object.values(stats.ratingBreakdown), 1);
  const totalFeltLevel =
    stats.feltLevelBreakdown.BELOW +
    stats.feltLevelBreakdown.AT +
    stats.feltLevelBreakdown.ABOVE;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-[#0B4F6C] text-[#0B4F6C]" />
        );
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-[#E2E8F0] absolute" />
            <div className="overflow-hidden w-[50%] absolute">
              <Star className="w-4 h-4 fill-[#0B4F6C] text-[#0B4F6C]" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-[#E2E8F0]" />
        );
      }
    }
    return stars;
  };

  const feltLevelLabel = (key: string) => {
    switch (key) {
      case "BELOW":
        return "Below Level";
      case "AT":
        return "At Level";
      case "ABOVE":
        return "Above Level";
      default:
        return key;
    }
  };

  const feltLevelColor = (key: string) => {
    switch (key) {
      case "BELOW":
        return "bg-amber-100 text-amber-700";
      case "AT":
        return "bg-[#E8F4F8] text-[#0B4F6C]";
      case "ABOVE":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-[#F1F5F9] text-[#333333]";
    }
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[#0B4F6C] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-8 tracking-wide">
          Your Stats
        </h1>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Games Played
              </h2>
            </div>
            <p className="text-3xl font-light text-[#0A0A0A]">{stats.totalGames}</p>
          </Card>

          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Star className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Avg Rating
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {renderStars(stats.avgRating)}
              </div>
              <span className="text-lg font-light text-[#0A0A0A]">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              {stats.ratingCount} {stats.ratingCount === 1 ? "rating" : "ratings"}
            </p>
          </Card>

          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Favorite Club
              </h2>
            </div>
            <p className="text-lg font-light text-[#0A0A0A]">
              {stats.favoriteClub || "None yet"}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Games Per Month */}
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A]">
                Games Per Month
              </h2>
            </div>
            <div className="space-y-3">
              {stats.gamesByMonth.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-sm text-[#64748B] w-20 shrink-0">{m.month}</span>
                  <div className="flex-1 h-7 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B4F6C] rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                      style={{
                        width: m.count > 0 ? `${Math.max((m.count / maxMonthCount) * 100, 12)}%` : "0%",
                      }}
                    >
                      {m.count > 0 && (
                        <span className="text-xs text-white font-medium">{m.count}</span>
                      )}
                    </div>
                  </div>
                  {m.count === 0 && (
                    <span className="text-xs text-[#64748B]">0</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Rating Distribution */}
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A]">
                Rating Distribution
              </h2>
            </div>
            {stats.ratingCount === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-8">No ratings received yet.</p>
            ) : (
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 shrink-0">
                      <Star className="w-4 h-4 fill-[#0B4F6C] text-[#0B4F6C]" />
                      <span className="text-sm text-[#333333]">{star}</span>
                    </div>
                    <div className="flex-1 h-6 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B4F6C] rounded-full transition-all duration-300"
                        style={{
                          width:
                            stats.ratingBreakdown[star] > 0
                              ? `${Math.max((stats.ratingBreakdown[star] / maxRatingCount) * 100, 8)}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-sm text-[#64748B] w-8 text-right">
                      {stats.ratingBreakdown[star]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Felt Level Breakdown */}
        <Card className="border-[#E2E8F0] rounded-xl p-6 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#0B4F6C]" />
            </div>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A]">
              How Others Rated Your Level
            </h2>
          </div>
          {totalFeltLevel === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-8">No felt level ratings yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["BELOW", "AT", "ABOVE"] as const).map((key) => {
                const count = stats.feltLevelBreakdown[key];
                const pct = totalFeltLevel > 0 ? Math.round((count / totalFeltLevel) * 100) : 0;
                return (
                  <div
                    key={key}
                    className={`rounded-xl p-5 text-center ${feltLevelColor(key)}`}
                  >
                    <p className="text-2xl font-light mb-1">{pct}%</p>
                    <p className="text-sm font-medium">{feltLevelLabel(key)}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {count} {count === 1 ? "rating" : "ratings"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
