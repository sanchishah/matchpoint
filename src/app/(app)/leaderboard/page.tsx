"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Star, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Tab = "games" | "rating" | "streak";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  skillLevel: number | null;
  gamesPlayed?: number;
  avgRating?: number;
  ratingCount?: number;
  streak?: number;
}

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "games", label: "Most Games", icon: <Trophy className="w-4 h-4" /> },
  { key: "rating", label: "Highest Rated", icon: <Star className="w-4 h-4" /> },
  { key: "streak", label: "Longest Streak", icon: <Flame className="w-4 h-4" /> },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("games");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?sort=${tab}`)
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-2 tracking-wide">
          Leaderboard
        </h1>
        <p className="text-[#64748B] mb-8">
          See how you stack up against other players.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-[#0B4F6C] text-white"
                  : "bg-[#F1F5F9] text-[#333333] hover:bg-[#E8F4F8]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-[#64748B]">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-[#64748B]">
            No data yet. Play some games to appear on the leaderboard!
          </div>
        ) : (
          <Card className="border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#E2E8F0]">
              {entries.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8F8F8] transition-colors"
                >
                  {/* Rank */}
                  <span
                    className={`w-8 text-center font-medium text-lg ${
                      entry.rank <= 3 ? "text-[#0B4F6C]" : "text-[#64748B]"
                    }`}
                  >
                    {entry.rank}
                  </span>

                  {/* Avatar */}
                  <Avatar size="sm">
                    <AvatarFallback className="bg-[#E8F4F8] text-[#0B4F6C] text-xs font-medium">
                      {entry.name[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + skill */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/players/${entry.userId}`}
                      className="text-sm font-medium text-[#0A0A0A] hover:text-[#0B4F6C] transition-colors truncate block"
                    >
                      {entry.name}
                    </Link>
                    {entry.skillLevel && (
                      <p className="text-xs text-[#64748B]">Level {entry.skillLevel}</p>
                    )}
                  </div>

                  {/* Stat */}
                  <div className="text-right">
                    {tab === "games" && (
                      <p className="text-lg font-medium text-[#0A0A0A]">
                        {entry.gamesPlayed}
                        <span className="text-xs text-[#64748B] font-normal ml-1">games</span>
                      </p>
                    )}
                    {tab === "rating" && (
                      <p className="text-lg font-medium text-[#0A0A0A]">
                        {entry.avgRating}
                        <Star className="w-3.5 h-3.5 inline ml-1 text-[#0B4F6C] fill-[#0B4F6C]" />
                        <span className="text-xs text-[#64748B] font-normal ml-1">
                          ({entry.ratingCount})
                        </span>
                      </p>
                    )}
                    {tab === "streak" && (
                      <p className="text-lg font-medium text-[#0A0A0A]">
                        {entry.streak}
                        <span className="text-xs text-[#64748B] font-normal ml-1">weeks</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
