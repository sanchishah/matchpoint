"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Plus, Trash2, Sparkles, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  active: boolean;
}

interface Suggestion {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  gameDensity: number;
}

export default function AvailabilityPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(12);
  const [pendingMatchCount, setPendingMatchCount] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/availability").then((r) => r.json()),
      fetch("/api/availability/matches?status=PENDING")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/availability/suggestions")
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([windowsData, matchesData, suggestionsData]) => {
        setWindows(windowsData);
        setPendingMatchCount(Array.isArray(matchesData) ? matchesData.length : 0);
        setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addWindow = async () => {
    setAdding(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, startHour, endHour }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add window");
        return;
      }
      const newWindow = await res.json();
      setWindows((prev) => [...prev, newWindow].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour));
      toast.success("Availability window added");
      // Remove from suggestions if it matches
      setSuggestions((prev) =>
        prev.filter(
          (s) => !(s.dayOfWeek === dayOfWeek && s.startHour === startHour)
        )
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const addSuggestionWindow = async (suggestion: Suggestion) => {
    const key = `${suggestion.dayOfWeek}-${suggestion.startHour}`;
    setAddingSuggestion(key);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: suggestion.dayOfWeek,
          startHour: suggestion.startHour,
          endHour: suggestion.endHour,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to add window");
        return;
      }
      const newWindow = await res.json();
      setWindows((prev) =>
        [...prev, newWindow].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour
        )
      );
      setSuggestions((prev) =>
        prev.filter(
          (s) =>
            !(
              s.dayOfWeek === suggestion.dayOfWeek &&
              s.startHour === suggestion.startHour
            )
        )
      );
      toast.success("Window added from suggestion");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddingSuggestion(null);
    }
  };

  const deleteWindow = async (id: string) => {
    try {
      const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setWindows((prev) => prev.filter((w) => w.id !== id));
      toast.success("Window removed");
    } catch {
      toast.error("Failed to remove window");
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading...</p>
      </div>
    );
  }

  // Group windows by day
  const byDay = DAYS.map((name, i) => ({
    name,
    dayIndex: i,
    windows: windows.filter((w) => w.dayOfWeek === i),
  }));

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        {/* Pending matches banner */}
        {pendingMatchCount > 0 && (
          <Link href="/dashboard/availability/matches">
            <Card className="border-[#0B4F6C]/20 bg-[#E8F4F8] rounded-xl p-4 mb-6 hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#0B4F6C]" />
                  <span className="text-sm text-[#0B4F6C] font-medium">
                    You have {pendingMatchCount} pending match
                    {pendingMatchCount !== 1 ? "es" : ""}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#0B4F6C]" />
              </div>
            </Card>
          </Link>
        )}

        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-7 h-7 text-[#0B4F6C]" />
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] tracking-wide">
            My Availability
          </h1>
        </div>
        <p className="text-[#64748B] mb-8">
          Set your weekly availability and get notified when matching games open up.
        </p>

        {/* Add Window Form */}
        <Card className="border-[#E2E8F0] rounded-xl p-6 mb-8">
          <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] mb-4">
            Add Availability Window
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-[#64748B] uppercase tracking-wider block mb-1.5">Day</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#333333] bg-white"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748B] uppercase tracking-wider block mb-1.5">From</label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#333333] bg-white"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748B] uppercase tracking-wider block mb-1.5">To</label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#333333] bg-white"
              >
                {HOURS.filter((h) => h > startHour).map((h) => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={addWindow}
            disabled={adding || endHour <= startHour}
            className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Window
          </Button>
        </Card>

        {/* Weekly Grid */}
        <div className="space-y-4 mb-10">
          {byDay.map((day) => (
            <div key={day.dayIndex}>
              <h3 className="font-[family-name:var(--font-heading)] text-sm text-[#64748B] uppercase tracking-wider mb-2">
                {day.name}
              </h3>
              {day.windows.length === 0 ? (
                <p className="text-sm text-[#94A3B8] mb-4">No windows set</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {day.windows.map((w) => (
                    <Card key={w.id} className="border-[#E2E8F0] rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm text-[#333333]">
                        {formatHour(w.startHour)} &ndash; {formatHour(w.endHour)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWindow(w.id)}
                        className="text-[#64748B] hover:text-red-500 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggested Windows */}
        {suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-[#0B4F6C]" />
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A]">
                Suggested Windows
              </h2>
            </div>
            <p className="text-sm text-[#64748B] mb-4">
              Based on game activity in your area over the past 90 days.
            </p>
            <div className="space-y-3">
              {suggestions.map((s) => {
                const key = `${s.dayOfWeek}-${s.startHour}`;
                return (
                  <Card
                    key={key}
                    className="border-[#E2E8F0] rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium text-[#333333]">
                        {DAYS[s.dayOfWeek]}
                      </span>
                      <span className="text-sm text-[#64748B] ml-2">
                        {formatHour(s.startHour)} &ndash; {formatHour(s.endHour)}
                      </span>
                      <span className="text-xs text-[#94A3B8] ml-3">
                        {s.gameDensity} game{s.gameDensity !== 1 ? "s" : ""} in
                        last 90 days
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#0B4F6C] text-[#0B4F6C] rounded-full text-xs"
                      onClick={() => addSuggestionWindow(s)}
                      disabled={addingSuggestion === key}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {addingSuggestion === key ? "Adding..." : "Add"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
