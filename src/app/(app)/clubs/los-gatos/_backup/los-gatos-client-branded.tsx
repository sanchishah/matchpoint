"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Users, Star, Trophy, CheckCircle, Clock, DollarSign, Zap } from "lucide-react";
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
        <div className="mb-12">
          <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs mb-4">
            Los Gatos, CA
          </Badge>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl text-[#0A0A0A] mb-3 tracking-wide">
            Pickleball at the APJCC
          </h1>
          <div className="flex items-center gap-2 text-[#64748B] mb-6">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-sm">{club.address}, {club.city}, {club.state} {club.zip}</span>
          </div>
          <p className="text-[#333333] text-lg leading-relaxed max-w-2xl mb-4">
            The Addison-Penzak Jewish Community Center is home to one of the South Bay&apos;s
            best pickleball communities. Dedicated outdoor courts, a welcoming atmosphere,
            and players who actually want to be matched by skill level.
          </p>
          <p className="text-[#64748B] text-base leading-relaxed max-w-2xl mb-8">
            MatchPoint handles the logistics &mdash; we book the courts, match you with players
            at your level, and split the cost evenly. No group texts. No guessing who&apos;s showing up.
            Just show up and play.
          </p>
          <Link href="/invite?club=los-gatos">
            <Button className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-base px-8 py-3 h-12">
              Join &amp; Play
            </Button>
          </Link>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-6">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-[#E2E8F0] rounded-xl p-6">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] text-base text-[#0A0A0A] mb-2">
                1. Set your level
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Tell us your skill level and age bracket. We use this to match you
                with compatible players &mdash; no more lopsided games.
              </p>
            </Card>
            <Card className="border-[#E2E8F0] rounded-xl p-6">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] text-base text-[#0A0A0A] mb-2">
                2. Pick a time
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Browse open sessions at the APJCC and reserve your spot. Courts are
                pre-booked &mdash; just choose what fits your schedule.
              </p>
            </Card>
            <Card className="border-[#E2E8F0] rounded-xl p-6">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] text-base text-[#0A0A0A] mb-2">
                3. Show up and play
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Once your game fills, you&apos;re confirmed. We handle payment splits,
                reminders, and game chat so you can focus on playing.
              </p>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="w-5 h-5 text-[#0B4F6C]" />
            </div>
            <p className="text-2xl font-light text-[#0A0A0A]">{club.stats.totalGames}</p>
            <p className="text-xs text-[#64748B] mt-1">Games Played</p>
          </Card>
          <Card className="border-[#E2E8F0] rounded-xl p-5 text-center">
            <div className="flex justify-center mb-2">
              <Users className="w-5 h-5 text-[#0B4F6C]" />
            </div>
            <p className="text-2xl font-light text-[#0A0A0A]">{club.stats.totalPlayers}</p>
            <p className="text-xs text-[#64748B] mt-1">Active Players</p>
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
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-5">
            Upcoming Sessions
          </h2>
          {club.upcomingSlots.length === 0 ? (
            <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
              <p className="text-[#333333] mb-2">No sessions on the schedule yet.</p>
              <p className="text-sm text-[#64748B]">
                Sign up and set your availability &mdash; we&apos;ll notify you as soon as a
                matching game opens at the APJCC.
              </p>
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
                    <span className="flex items-center gap-0.5">
                      <DollarSign className="w-3 h-3" />
                      {formatCents(slot.perPersonCents)}/person
                    </span>
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

        {/* About the Venue */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-4">
            About the Venue
          </h2>
          <div className="space-y-4 text-[#333333] leading-relaxed">
            <p>
              The Addison-Penzak JCC sits on Oka Road in Los Gatos, tucked into the
              foothills with easy access from Highway 17 and Los Gatos Boulevard.
              The facility features well-maintained outdoor courts with excellent
              lighting for morning and evening play.
            </p>
            <p>
              Whether you&apos;re a beginner looking to learn proper technique or an
              advanced player chasing competitive rallies, the APJCC pickleball
              community is one of the most active in the South Bay. MatchPoint
              organizes regular sessions here so you always have a game to look forward to.
            </p>
          </div>
        </div>

        {/* Why MatchPoint */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-5">
            Why Play Through MatchPoint?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#0B4F6C] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">Skill-matched games</p>
                <p className="text-xs text-[#64748B] mt-0.5">Play with people at your level, from beginner to expert</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#0B4F6C] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">Courts pre-booked</p>
                <p className="text-xs text-[#64748B] mt-0.5">No scrambling for court time &mdash; we handle reservations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#0B4F6C] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">Fair cost splitting</p>
                <p className="text-xs text-[#64748B] mt-0.5">Court fees split evenly &mdash; you only pay when the game confirms</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#0B4F6C] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#0A0A0A]">Ratings &amp; history</p>
                <p className="text-xs text-[#64748B] mt-0.5">Track your games, rate opponents, and watch your level evolve</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <Card className="border-[#E2E8F0] rounded-xl p-8 bg-[#E8F4F8] text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-2">
            Ready to get on the court?
          </h2>
          <p className="text-[#333333] mb-6 max-w-md mx-auto">
            Create a free MatchPoint account, set your skill level, and
            reserve your first session at the APJCC.
          </p>
          <Link href="/invite?club=los-gatos">
            <Button className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-base px-8 py-3 h-12">
              Sign Up &amp; Play
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
