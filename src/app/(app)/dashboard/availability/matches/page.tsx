"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Sparkles, Clock, MapPin, Users, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DotLoader } from "@/components/dot-loader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SKILL_LEVELS, AGE_BRACKETS } from "@/lib/constants";

interface MatchData {
  id: string;
  slotId: string;
  qualityScore: number;
  status: string;
  notifiedAt: string;
  slot: {
    id: string;
    startTime: string;
    durationMins: number;
    format: string;
    requiredPlayers: number;
    totalCostCents: number;
    skillLevel: number;
    ageBracket: string;
    joinedCount: number;
    spotsLeft: number;
    club: { id: string; name: string; address: string; city: string };
  };
  window: { dayOfWeek: number; startHour: number; endHour: number };
}

export default function AvailabilityMatchesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/availability/matches?status=PENDING")
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch(() => toast.error("Failed to load matches"))
      .finally(() => setLoading(false));
  }, [session]);

  const joinMatch = async (matchId: string) => {
    setJoining(matchId);
    try {
      const res = await fetch(`/api/availability/matches/${matchId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
      } else {
        toast.success(data.message);
        setMatches((prev) => prev.filter((m) => m.id !== matchId));
      }
    } catch {
      toast.error("Failed to join");
    } finally {
      setJoining(null);
    }
  };

  const dismissMatch = async (matchId: string) => {
    setDismissing(matchId);
    try {
      const res = await fetch(`/api/availability/matches/${matchId}/dismiss`, {
        method: "POST",
      });
      if (!res.ok) {
        toast.error("Failed to dismiss");
      } else {
        setMatches((prev) => prev.filter((m) => m.id !== matchId));
      }
    } catch {
      toast.error("Failed to dismiss");
    } finally {
      setDismissing(null);
    }
  };

  const skillLabel = (level: number) =>
    SKILL_LEVELS.find((s) => s.value === level)?.label || `Level ${level}`;
  const ageLabel = (bracket: string) =>
    AGE_BRACKETS.find((a) => a.value === bracket)?.label || bracket;

  const scoreColor = (score: number) => {
    if (score >= 80) return "bg-[#F0FDF4] text-[#166534]";
    if (score >= 50) return "bg-[#FFFBEB] text-[#92400E]";
    return "bg-[#F1F5F9] text-[#64748B]";
  };

  if (authStatus === "loading" || loading) {
    return <DotLoader />;
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-6">
        <Link
          href="/dashboard/availability"
          className="text-sm text-[#0B4F6C] flex items-center gap-1 hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Availability
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-7 h-7 text-[#0B4F6C]" />
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] tracking-wide">
            Your Matches
          </h1>
        </div>
        <p className="text-[#64748B] mb-8">
          Games that match your availability windows, scored by quality.
        </p>

        {matches.length === 0 ? (
          <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
            <Sparkles className="w-10 h-10 text-[#94A3B8] mx-auto mb-4" />
            <p className="text-[#64748B] mb-2">No matches yet.</p>
            <p className="text-sm text-[#94A3B8]">
              Set your availability windows to get matched with games.
            </p>
            <Link href="/dashboard/availability">
              <Button
                variant="outline"
                className="mt-4 border-[#0B4F6C] text-[#0B4F6C] rounded-lg"
              >
                Set Availability
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const perPerson = Math.round(
                match.slot.totalCostCents / match.slot.requiredPlayers
              );
              return (
                <Card
                  key={match.id}
                  className="border-[#E2E8F0] rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                        {match.slot.club.name}
                      </h3>
                      <p className="text-sm text-[#64748B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" /> {match.slot.club.city}
                      </p>
                    </div>
                    <Badge
                      className={`${scoreColor(match.qualityScore)} border-0 rounded-full text-xs font-medium`}
                    >
                      {Math.round(match.qualityScore)}% match
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#333333] mb-3">
                    <Clock className="w-4 h-4 text-[#0B4F6C]" />
                    {format(new Date(match.slot.startTime), "EEE, MMM d · h:mm a")}
                    <span className="text-[#64748B]">
                      ({match.slot.durationMins}min)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge
                      variant="secondary"
                      className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs"
                    >
                      {match.slot.format === "SINGLES" ? "Singles" : "Doubles"}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-[#F1F5F9] text-[#0B4F6C] border-0 rounded-full text-xs"
                    >
                      Lvl {match.slot.skillLevel} ·{" "}
                      {skillLabel(match.slot.skillLevel)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-[#F8F8F8] text-[#333333] border-0 rounded-full text-xs"
                    >
                      {ageLabel(match.slot.ageBracket)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-[#0A0A0A]">
                      ${(perPerson / 100).toFixed(2)}
                      <span className="text-sm text-[#64748B] font-normal">
                        {" "}
                        /person
                      </span>
                    </span>
                    <span className="text-sm text-[#64748B] flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {match.slot.joinedCount}/{match.slot.requiredPlayers}
                      <span className="ml-1">
                        ({match.slot.spotsLeft} spot
                        {match.slot.spotsLeft !== 1 ? "s" : ""} left)
                      </span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full mb-4">
                    <div
                      className="h-full bg-[#0B4F6C] rounded-full transition-all"
                      style={{
                        width: `${(match.slot.joinedCount / match.slot.requiredPlayers) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full"
                      onClick={() => joinMatch(match.id)}
                      disabled={joining === match.id}
                    >
                      {joining === match.id ? "Joining..." : "Join Game"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#E2E8F0] text-[#64748B] rounded-full"
                      onClick={() => dismissMatch(match.id)}
                      disabled={dismissing === match.id}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
