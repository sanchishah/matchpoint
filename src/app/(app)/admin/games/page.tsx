"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Users, CreditCard, Check } from "lucide-react";

interface GameData {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  slot: { format: string; totalCostCents: number; club: { name: string; city: string } };
  participants: {
    userId: string;
    user: { id: string; name: string | null; email: string; profile: { name: string } | null };
  }[];
  payments: { userId: string; amountCents: number; status: string; stripePaymentIntentId: string | null }[];
  attendances: { userId: string; present: boolean }[];
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin/games")
      .then((r) => r.json())
      .then(setGames)
      .finally(() => setLoading(false));
  }, []);

  const openAttendance = (game: GameData) => {
    setSelectedGame(game);
    const map: Record<string, boolean> = {};
    game.participants.forEach((p) => {
      const att = game.attendances?.find((a) => a.userId === p.userId);
      map[p.userId] = att?.present ?? true;
    });
    setAttendanceMap(map);
  };

  const submitAttendance = async () => {
    if (!selectedGame) return;
    const attendances = Object.entries(attendanceMap).map(([userId, present]) => ({ userId, present }));
    const res = await fetch(`/api/admin/games/${selectedGame.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendances }),
    });
    if (res.ok) {
      toast.success("Attendance recorded & game completed");
      setSelectedGame(null);
      const updated = await fetch("/api/admin/games").then((r) => r.json());
      setGames(updated);
    } else {
      toast.error("Failed to record attendance");
    }
  };

  const triggerRefund = async (gameId: string, userId: string) => {
    if (!confirm("Trigger refund for this player?")) return;
    const res = await fetch(`/api/admin/games/${gameId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      toast.success("Refund processed");
    } else {
      const data = await res.json();
      toast.error(data.error || "Refund failed");
    }
  };

  if (loading) return <p className="text-[#64748B]">Loading games...</p>;

  return (
    <div>
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-6">
        Games ({games.length})
      </h2>

      <div className="space-y-4">
        {games.map((game) => (
          <Card key={game.id} className="border-[#E2E8F0] rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[#0A0A0A] font-medium">{game.slot.club.name}</h3>
                  <Badge className={`border-0 rounded-full text-xs ${
                    game.status === "CONFIRMED" ? "bg-[#E8F4F8] text-[#0B4F6C]" :
                    game.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                    "bg-red-50 text-red-600"
                  }`}>{game.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-[#64748B]">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(game.startTime), "MMM d, h:mm a")}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{game.participants.length} players</span>
                  <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />${(game.slot.totalCostCents / 100).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {game.participants.map((p) => (
                    <span key={p.userId} className="text-xs bg-[#F8F8F8] px-2 py-1 rounded-full">
                      {p.user.profile?.name || p.user.name || p.user.email}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {game.status === "CONFIRMED" && new Date() > new Date(game.endTime) && (
                  <Button size="sm" className="bg-[#0B4F6C] text-white rounded-lg text-xs" onClick={() => openAttendance(game)}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Attendance
                  </Button>
                )}
              </div>
            </div>

            {/* Payments */}
            {game.payments && game.payments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                <p className="text-xs text-[#64748B] mb-2">Payments:</p>
                <div className="space-y-1">
                  {game.payments.map((pay) => {
                    const player = game.participants.find((p) => p.userId === pay.userId);
                    return (
                      <div key={pay.userId} className="flex justify-between items-center text-xs">
                        <span className="text-[#333333]">
                          {player?.user.profile?.name || player?.user.email} — ${(pay.amountCents / 100).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={`border-0 rounded-full text-[10px] ${
                            pay.status === "SUCCEEDED" ? "bg-[#E8F4F8] text-[#0B4F6C]" :
                            pay.status === "REFUNDED" ? "bg-[#F1F5F9] text-blue-600" :
                            "bg-red-50 text-red-600"
                          }`}>{pay.status}</Badge>
                          {pay.status === "SUCCEEDED" && (
                            <button className="text-red-500 hover:underline" onClick={() => triggerRefund(game.id, pay.userId)}>
                              Refund
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Attendance Dialog */}
      <Dialog open={!!selectedGame} onOpenChange={(open) => !open && setSelectedGame(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)]">Mark Attendance</DialogTitle>
          </DialogHeader>
          {selectedGame && (
            <div className="space-y-4 mt-4">
              {selectedGame.participants.map((p) => (
                <div key={p.userId} className="flex items-center justify-between">
                  <span className="text-sm text-[#333333]">{p.user.profile?.name || p.user.name}</span>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={attendanceMap[p.userId] ?? true}
                      onCheckedChange={(checked) => setAttendanceMap({ ...attendanceMap, [p.userId]: !!checked })}
                    />
                    <span className="text-xs text-[#64748B]">
                      {attendanceMap[p.userId] ? "Present" : "No-show"}
                    </span>
                  </div>
                </div>
              ))}
              <Button onClick={submitAttendance} className="w-full bg-[#0B4F6C] text-white rounded-lg">
                Submit & Complete Game
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
