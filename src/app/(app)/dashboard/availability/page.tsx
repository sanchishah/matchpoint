"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, Plus, Trash2 } from "lucide-react";
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

export default function AvailabilityPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(12);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    fetch("/api/availability")
      .then((res) => res.json())
      .then((data) => setWindows(data))
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
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
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
        <div className="space-y-4">
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
      </div>
    </div>
  );
}
