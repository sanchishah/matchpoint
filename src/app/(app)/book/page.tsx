"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Heart, Users, Clock, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SKILL_LEVELS, AGE_BRACKETS } from "@/lib/constants";

interface SlotData {
  id: string;
  club: { id: string; name: string; address: string; city: string };
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
}

export default function BookPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("10");
  const [date, setDate] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (zip) params.set("zip", zip);
    if (radius) params.set("radius", radius);
    if (date) params.set("date", date);
    if (skillFilter) params.set("skillLevel", skillFilter);
    if (ageFilter) params.set("ageBracket", ageFilter);

    try {
      const res = await fetch(`/api/slots?${params}`);
      const data = await res.json();
      setSlots(data);
    } catch {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [zip, radius, date, skillFilter, ageFilter]);

  const fetchFavorites = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/favorites");
      const data = await res.json();
      setFavorites(data.map((c: { id: string }) => c.id));
    } catch { /* ignore */ }
  }, [session]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

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

  const skillLabel = (level: number) =>
    SKILL_LEVELS.find((s) => s.value === level)?.label || `Level ${level}`;

  const ageLabel = (bracket: string) =>
    AGE_BRACKETS.find((a) => a.value === bracket)?.label || bracket;

  // Sort: favorites first
  const sortedSlots = [...slots].sort((a, b) => {
    const aFav = favorites.includes(a.club.id) ? 0 : 1;
    const bFav = favorites.includes(b.club.id) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <div className="py-12">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#2A2A2A] mb-3 tracking-wide">
          Reserve Your Court & Rally!
        </h1>
        <p className="text-[#717171] mb-8 max-w-xl">
          Browse available courts in the South Bay. You&apos;re only charged when a game is confirmed.
        </p>

        {/* Filters */}
        <div className="mb-8">
          <Button
            variant="outline"
            className="border-[#F1F1F1] text-[#4A4A4A] rounded-full mb-4 md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
          <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${showFilters ? "" : "hidden md:grid"}`}>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#717171] mb-1.5 block">Zip Code</Label>
              <Input
                placeholder="e.g. 95014"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="border-[#F1F1F1] rounded-xl h-11"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#717171] mb-1.5 block">Radius</Label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="border-[#F1F1F1] rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 miles</SelectItem>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#717171] mb-1.5 block">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-[#F1F1F1] rounded-xl h-11"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#717171] mb-1.5 block">Skill Level</Label>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="border-[#F1F1F1] rounded-xl h-11">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {SKILL_LEVELS.map((s) => (
                    <SelectItem key={s.value} value={String(s.value)}>
                      {s.value} — {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-[#717171] mb-1.5 block">Age Bracket</Label>
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="border-[#F1F1F1] rounded-xl h-11">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  {AGE_BRACKETS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button
              onClick={fetchSlots}
              className="bg-[#3F6F5E] hover:bg-[#345C4E] text-white rounded-full px-6"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Slots Grid */}
        {loading ? (
          <div className="text-center py-20 text-[#717171]">Loading available courts...</div>
        ) : sortedSlots.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#717171] mb-4">No slots match your filters.</p>
            <p className="text-sm text-[#717171]">
              Try expanding your radius or changing your preferences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSlots.map((slot) => (
              <Card
                key={slot.id}
                className="border-[#F1F1F1] rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-lg text-[#2A2A2A]">
                      {slot.club.name}
                    </h3>
                    <p className="text-sm text-[#717171] flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {slot.club.city}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(slot.club.id)}
                    className="p-1.5 hover:bg-[#DDEFE6] rounded-full transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(slot.club.id)
                          ? "fill-[#3F6F5E] text-[#3F6F5E]"
                          : "text-[#717171]"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#4A4A4A] mb-3">
                  <Clock className="w-4 h-4 text-[#3F6F5E]" />
                  {format(new Date(slot.startTime), "EEE, MMM d · h:mm a")}
                  <span className="text-[#717171]">({slot.durationMins}min)</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-[#DDEFE6] text-[#3F6F5E] border-0 rounded-full text-xs">
                    {slot.format === "SINGLES" ? "Singles" : "Doubles"}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#E6F0F6] text-[#3F6F5E] border-0 rounded-full text-xs">
                    Lvl {slot.skillLevel} · {skillLabel(slot.skillLevel)}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#F8F8F8] text-[#4A4A4A] border-0 rounded-full text-xs">
                    {ageLabel(slot.ageBracket)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-medium text-[#2A2A2A]">
                    ${(slot.perPersonCents / 100).toFixed(2)}
                    <span className="text-sm text-[#717171] font-normal"> /person</span>
                  </span>
                  <span className="text-sm text-[#717171] flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {slot.joinedCount}/{slot.requiredPlayers}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#F1F1F1] rounded-full mb-4">
                  <div
                    className="h-full bg-[#3F6F5E] rounded-full transition-all"
                    style={{ width: `${(slot.joinedCount / slot.requiredPlayers) * 100}%` }}
                  />
                </div>

                {slot.userJoined ? (
                  <div className="flex gap-2">
                    <Badge className="bg-[#DDEFE6] text-[#3F6F5E] border-0 rounded-full flex-1 justify-center py-2">
                      Reserved
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#F1F1F1] text-[#717171] rounded-full text-xs"
                      onClick={() => cancelSlot(slot.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : slot.userWaitlisted ? (
                  <Badge className="bg-[#E6F0F6] text-[#3F6F5E] border-0 rounded-full w-full justify-center py-2">
                    On Waitlist
                  </Badge>
                ) : slot.spotsLeft > 0 ? (
                  <Button
                    className="w-full bg-[#3F6F5E] hover:bg-[#345C4E] text-white rounded-full"
                    onClick={() => joinSlot(slot.id)}
                    disabled={joining === slot.id}
                  >
                    {joining === slot.id ? "Reserving..." : "Reserve My Spot"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-[#3F6F5E] text-[#3F6F5E] rounded-full"
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

        <p className="text-center text-xs text-[#717171] mt-10 max-w-lg mx-auto">
          Slots are only confirmed when all required players are found (2 for singles, 4 for doubles).
          You&apos;re only charged when confirmed.
        </p>
      </div>
    </div>
  );
}
