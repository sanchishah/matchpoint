"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Users, Star, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { skillLabel, ageBracketLabel, formatCents } from "@/lib/constants";

interface SlotData {
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
}

interface ClubData {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string | null;
  stats: {
    totalGames: number;
    totalPlayers: number;
    avgRating: number | null;
  };
  upcomingSlots: SlotData[];
}

export default function LosGatosClient() {
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clubs/by-slug/los-gatos")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setClub(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <div className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl text-[#0A0A0A] mb-3 tracking-wide">
            {club.name}
          </h1>
          <div className="flex items-center gap-2 text-[#64748B] mb-6">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{club.address}, {club.city}, {club.state} {club.zip}</span>
          </div>
          <p className="text-[#333333] text-lg leading-relaxed max-w-2xl mb-8">
            The Addison-Penzak Jewish Community Center in Los Gatos offers a vibrant pickleball
            program with organized, skill-matched play. Whether you&apos;re just getting started or
            competing at an advanced level, MatchPoint makes it easy to find your game.
          </p>
          <Link href="/invite?club=los-gatos">
            <Button className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-base px-8 py-3 h-12">
              Join &amp; Play
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="w-5 h-5 text-[#0B4F6C]" />
            </div>
            <p className="text-2xl font-light text-[#0A0A0A]">{club.stats.totalGames}</p>
            <p className="text-xs text-[#64748B] mt-1">Total Games</p>
          </Card>
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <div className="flex justify-center mb-2">
              <Users className="w-5 h-5 text-[#0B4F6C]" />
            </div>
            <p className="text-2xl font-light text-[#0A0A0A]">{club.stats.totalPlayers}</p>
            <p className="text-xs text-[#64748B] mt-1">Players</p>
          </Card>
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <div className="flex justify-center mb-2">
              <Star className="w-5 h-5 text-[#0B4F6C]" />
            </div>
            <p className="text-2xl font-light text-[#0A0A0A]">
              {club.stats.avgRating ? club.stats.avgRating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-[#64748B] mt-1">Avg Rating</p>
          </Card>
        </div>

        {/* Upcoming Slots */}
        <div className="mb-10">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-5">
            Upcoming Games
          </h2>
          {club.upcomingSlots.length === 0 ? (
            <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
              <p className="text-[#64748B]">No upcoming games right now. Check back soon!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {club.upcomingSlots.map((slot) => (
                <Card key={slot.id} className="border-[#E2E8F0] rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-[#0A0A0A]">
                        {format(new Date(slot.startTime), "EEE, MMM d")}
                      </p>
                      <p className="text-sm text-[#64748B]">
                        {format(new Date(slot.startTime), "h:mm a")} &middot; {slot.durationMins} min
                      </p>
                    </div>
                    <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs">
                      {slot.format === "SINGLES" ? "Singles" : "Doubles"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#64748B] mb-3">
                    <span>{skillLabel(slot.skillLevel)}</span>
                    <span>{ageBracketLabel(slot.ageBracket)}</span>
                    <span>{formatCents(slot.perPersonCents)}/person</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B]">
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      {slot.joinedCount}/{slot.requiredPlayers} joined
                    </span>
                    {slot.spotsLeft > 0 && (
                      <span className="text-xs font-medium text-[#0B4F6C]">
                        {slot.spotsLeft} {slot.spotsLeft === 1 ? "spot" : "spots"} left
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* About Section */}
        {club.notes && (
          <div className="mb-10">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-4">
              About
            </h2>
            <p className="text-[#333333] leading-relaxed">{club.notes}</p>
          </div>
        )}

        {/* Bottom CTA */}
        <Card className="border-[#E2E8F0] rounded-xl p-8 bg-[#E8F4F8] text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-2">
            Ready to play?
          </h2>
          <p className="text-[#333333] mb-6">
            Sign up for MatchPoint and reserve your spot at {club.name}.
          </p>
          <Link href="/invite?club=los-gatos">
            <Button className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-base px-8 py-3 h-12">
              Join &amp; Play
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
