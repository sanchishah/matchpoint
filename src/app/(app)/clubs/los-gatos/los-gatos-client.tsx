"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { Heart, Users, Clock, MapPin, Repeat, Download, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DotLoaderInline } from "@/components/dot-loader";
import { toast } from "sonner";
import { SKILL_LEVELS, AGE_BRACKETS } from "@/lib/constants";

interface SlotData {
  id: string;
  club: { id: string; name: string; address: string; city: string; lat: number; lng: number };
  startTime: string;
  durationMins: number;
  format: string;
  requiredPlayers: number;
  perPersonCents: number;
  skillLevel: number;
  ageBracket: string;
  joinedCount: number;
  spotsLeft: number;
  userJoined: boolean;
  userWaitlisted: boolean;
  recurringGroupId: string | null;
  friendsInSlot: string[];
  recurringInfo: {
    groupId: string;
    totalInSeries: number;
    remainingInSeries: number;
    userSubscribed: boolean;
  } | null;
}

interface ClubInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string | null;
}

export default function LosGatosClient() {
  const { data: session } = useSession();
  const [club, setClub] = useState<ClubInfo | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [joining, setJoining] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch club info
      const clubRes = await fetch("/api/clubs/by-slug/los-gatos");
      if (clubRes.ok) {
        const clubData = await clubRes.json();
        setClub(clubData);
      }

      // Fetch all slots and filter to this club
      const res = await fetch("/api/slots");
      if (res.ok) {
        const data: SlotData[] = await res.json();
        // Filter to Los Gatos / APJCC club
        const clubSlots = data.filter(
          (s) => s.club.name === "Addison-Penzak JCC" || s.club.city === "Los Gatos"
        );
        setSlots(clubSlots);
      }
    } catch {
      toast.error("Failed to load courts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => setFavorites(data.map((c: { id: string }) => c.id)))
      .catch(() => {});
  }, [session]);

  const toggleFavorite = async (clubId: string) => {
    if (!session) {
      toast.error("Please sign in to favorite clubs");
      return;
    }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });
      const data = await res.json();
      if (data.favorited) {
        setFavorites((prev) => [...prev, clubId]);
      } else {
        setFavorites((prev) => prev.filter((id) => id !== clubId));
      }
    } catch {
      toast.error("Failed to update favorite");
    }
  };

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
        fetchSlots();
      }
    } catch {
      toast.error("Failed to join slot");
    } finally {
      setJoining(null);
    }
  };

  const cancelSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/slots/${slotId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
      } else {
        toast.success("Reservation cancelled");
        fetchSlots();
      }
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const toggleSubscription = async (groupId: string, subscribed: boolean) => {
    if (!session) {
      toast.error("Please sign in to subscribe");
      return;
    }
    setSubscribing(groupId);
    try {
      const res = await fetch(`/api/recurring/${groupId}/subscribe`, {
        method: subscribed ? "DELETE" : "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error);
      } else {
        toast.success(subscribed ? "Unsubscribed from series" : "Subscribed to series!");
        fetchSlots();
      }
    } catch {
      toast.error("Failed to update subscription");
    } finally {
      setSubscribing(null);
    }
  };

  const skillLabel = (level: number) =>
    SKILL_LEVELS.find((s) => s.value === level)?.label || `Level ${level}`;

  const ageLabel = (bracket: string) =>
    AGE_BRACKETS.find((a) => a.value === bracket)?.label || bracket;

  return (
    <div className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-[#0A0A0A] mb-3 tracking-wide">
          {club?.name || "Addison-Penzak JCC"}
        </h1>
        {club && (
          <p className="text-[#64748B] mb-2 flex items-center gap-1.5 text-sm">
            <MapPin className="w-4 h-4" />
            {club.address}, {club.city}, {club.state} {club.zip}
          </p>
        )}
        <p className="text-[#64748B] mb-8 whitespace-nowrap">
          Browse available courts and reserve your spot. You&apos;re only charged when a game is confirmed.
        </p>

        {/* Slots Grid */}
        {loading ? (
          <DotLoaderInline message="Finding courts" />
        ) : slots.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#64748B] mb-4">No courts available right now.</p>
            <p className="text-sm text-[#64748B]">
              Check back soon &mdash; new sessions are added regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <Card
                key={slot.id}
                className="border-[#E2E8F0] rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Link href={`/clubs/${slot.club.id}`}>
                      <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] hover:text-[#0B4F6C] transition-colors">
                        {slot.club.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-[#64748B] flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {slot.club.city}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(slot.club.id)}
                    className="p-1.5 hover:bg-[#E8F4F8] rounded-full transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(slot.club.id)
                          ? "fill-[#0B4F6C] text-[#0B4F6C]"
                          : "text-[#64748B]"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#333333] mb-3">
                  <Clock className="w-4 h-4 text-[#0B4F6C]" />
                  {format(new Date(slot.startTime), "EEE, MMM d · h:mm a")}
                  <span className="text-[#64748B]">({slot.durationMins}min)</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs">
                    {slot.format === "SINGLES" ? "Singles" : "Doubles"}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#F1F5F9] text-[#0B4F6C] border-0 rounded-full text-xs">
                    Lvl {slot.skillLevel} · {skillLabel(slot.skillLevel)}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#F8F8F8] text-[#333333] border-0 rounded-full text-xs">
                    {ageLabel(slot.ageBracket)}
                  </Badge>
                  {slot.recurringInfo && (
                    <Badge variant="secondary" className="bg-[#F0FDF4] text-[#166534] border-0 rounded-full text-xs">
                      <Repeat className="w-3 h-3 mr-1" />
                      Weekly · {slot.recurringInfo.remainingInSeries} left
                    </Badge>
                  )}
                </div>

                {/* Friends playing indicator */}
                {slot.friendsInSlot.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-[#0B4F6C]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{slot.friendsInSlot.join(", ")} playing</span>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-medium text-[#0A0A0A]">
                    ${(slot.perPersonCents / 100).toFixed(2)}
                    <span className="text-sm text-[#64748B] font-normal"> /person</span>
                  </span>
                  <span className="text-sm text-[#64748B] flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {slot.joinedCount}/{slot.requiredPlayers}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full mb-4">
                  <div
                    className="h-full bg-[#0B4F6C] rounded-full transition-all"
                    style={{ width: `${(slot.joinedCount / slot.requiredPlayers) * 100}%` }}
                  />
                </div>

                {slot.userJoined ? (
                  <div className="flex gap-2">
                    <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full flex-1 justify-center py-2">
                      Reserved
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E2E8F0] text-[#64748B] rounded-full text-xs"
                      onClick={() => cancelSlot(slot.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : slot.userWaitlisted ? (
                  <Badge className="bg-[#F1F5F9] text-[#0B4F6C] border-0 rounded-full w-full justify-center py-2">
                    On Waitlist
                  </Badge>
                ) : slot.spotsLeft > 0 ? (
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

                {/* Recurring series actions */}
                {slot.recurringInfo && session && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 rounded-full text-xs ${
                        slot.recurringInfo.userSubscribed
                          ? "border-[#166534] text-[#166534]"
                          : "border-[#E2E8F0] text-[#64748B]"
                      }`}
                      onClick={() =>
                        toggleSubscription(slot.recurringInfo!.groupId, slot.recurringInfo!.userSubscribed)
                      }
                      disabled={subscribing === slot.recurringInfo.groupId}
                    >
                      <Repeat className="w-3.5 h-3.5 mr-1" />
                      {slot.recurringInfo.userSubscribed ? "Subscribed" : "Subscribe"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E2E8F0] text-[#64748B] rounded-full text-xs"
                      asChild
                    >
                      <a href={`/api/recurring/${slot.recurringInfo.groupId}/calendar`}>
                        <Download className="w-3.5 h-3.5 mr-1" /> .ics
                      </a>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#64748B] mt-10 max-w-lg mx-auto">
          Slots are only confirmed when all required players are found (2 for singles, 4 for doubles).
          You&apos;re only charged when confirmed.
        </p>
      </div>
    </div>
  );
}
