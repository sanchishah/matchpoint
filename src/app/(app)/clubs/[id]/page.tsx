"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { MapPin, Users, Star, Calendar, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SKILL_LEVELS, AGE_BRACKETS } from "@/lib/constants";

interface ClubData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  notes: string | null;
  stats: {
    totalGames: number;
    totalPlayers: number;
    avgRating: number | null;
  };
  upcomingSlots: {
    id: string;
    startTime: string;
    durationMins: number;
    format: string;
    requiredPlayers: number;
    perPersonCents: number;
    skillLevel: number;
    ageBracket: string;
    joinedCount: number;
    spotsLeft: number;
  }[];
}

export default function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clubs/${id}`)
      .then((res) => res.json())
      .then((data) => setClub(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const joinSlot = async (slotId: string) => {
    if (!session) {
      toast.error("Please sign in to reserve a spot");
      return;
    }
    setJoining(slotId);
    try {
      const res = await fetch(`/api/slots/${slotId}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
      } else {
        toast.success(data.message);
        // Refresh club data
        const refreshRes = await fetch(`/api/clubs/${id}`);
        const refreshData = await refreshRes.json();
        setClub(refreshData);
      }
    } catch {
      toast.error("Failed to join slot");
    } finally {
      setJoining(null);
    }
  };

  const skillLabel = (level: number) =>
    SKILL_LEVELS.find((s) => s.value === level)?.label || `Level ${level}`;
  const ageLabel = (bracket: string) =>
    AGE_BRACKETS.find((a) => a.value === bracket)?.label || bracket;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading...</p>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Club not found.</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-2 tracking-wide">
            {club.name}
          </h1>
          <p className="text-[#64748B] flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {club.address}, {club.city}, {club.state} {club.zip}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <Calendar className="w-6 h-6 text-[#0B4F6C] mx-auto mb-2" />
            <p className="text-2xl font-medium text-[#0A0A0A]">{club.stats.totalGames}</p>
            <p className="text-xs text-[#64748B]">Total Games</p>
          </Card>
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <Users className="w-6 h-6 text-[#0B4F6C] mx-auto mb-2" />
            <p className="text-2xl font-medium text-[#0A0A0A]">{club.stats.totalPlayers}</p>
            <p className="text-xs text-[#64748B]">Players</p>
          </Card>
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <Star className="w-6 h-6 text-[#0B4F6C] mx-auto mb-2" />
            <p className="text-2xl font-medium text-[#0A0A0A]">
              {club.stats.avgRating || "—"}
            </p>
            <p className="text-xs text-[#64748B]">Avg Rating</p>
          </Card>
        </div>

        {/* Upcoming Slots */}
        <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-5 tracking-wide">
          Upcoming Slots
        </h2>
        {club.upcomingSlots.length === 0 ? (
          <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
            <p className="text-[#64748B]">No upcoming slots at this club.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {club.upcomingSlots.map((slot) => (
              <Card key={slot.id} className="border-[#E2E8F0] rounded-xl p-5">
                <div className="flex items-center gap-2 text-sm text-[#333333] mb-3">
                  <Clock className="w-4 h-4 text-[#0B4F6C]" />
                  {format(new Date(slot.startTime), "EEE, MMM d · h:mm a")}
                  <span className="text-[#64748B]">({slot.durationMins}min)</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs">
                    {slot.format === "SINGLES" ? "Singles" : "Doubles"}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#F1F5F9] text-[#0B4F6C] border-0 rounded-full text-xs">
                    Lvl {slot.skillLevel} · {skillLabel(slot.skillLevel)}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#F8F8F8] text-[#333333] border-0 rounded-full text-xs">
                    {ageLabel(slot.ageBracket)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-medium text-[#0A0A0A]">
                    ${(slot.perPersonCents / 100).toFixed(2)}
                    <span className="text-sm text-[#64748B] font-normal"> /person</span>
                  </span>
                  <span className="text-sm text-[#64748B] flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {slot.joinedCount}/{slot.requiredPlayers}
                  </span>
                </div>
                {slot.spotsLeft > 0 ? (
                  <Button
                    className="w-full bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full"
                    onClick={() => joinSlot(slot.id)}
                    disabled={joining === slot.id}
                  >
                    {joining === slot.id ? "Reserving..." : "Reserve My Spot"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-[#0B4F6C] text-[#0B4F6C] rounded-full"
                    onClick={() => joinSlot(slot.id)}
                    disabled={joining === slot.id}
                  >
                    {joining === slot.id ? "Joining..." : "Join Waitlist"}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}

        {club.notes && (
          <Card className="border-[#E2E8F0] rounded-xl p-5 mt-8">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] mb-2">
              About This Club
            </h3>
            <p className="text-sm text-[#333333]">{club.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
