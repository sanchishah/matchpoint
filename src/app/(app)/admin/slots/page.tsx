"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Calendar } from "lucide-react";
import { SKILL_LEVELS, AGE_BRACKETS } from "@/lib/constants";

interface Club { id: string; name: string; }
interface SlotData {
  id: string;
  startTime: string;
  durationMins: number;
  format: string;
  requiredPlayers: number;
  totalCostCents: number;
  skillLevel: number;
  ageBracket: string;
  status: string;
  club: { name: string; city: string };
  participants: { userId: string; status: string }[];
  game: { id: string; status: string } | null;
}

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    clubId: "", startTime: "", durationMins: 60, format: "DOUBLES" as string,
    totalCostCents: 1000, skillLevel: 3, ageBracket: "AGE_25_34", notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/slots").then((r) => r.json()),
      fetch("/api/admin/clubs").then((r) => r.json()),
    ]).then(([s, c]) => {
      setSlots(s);
      setClubs(c);
      setLoading(false);
    });
  }, []);

  const fetchSlots = async () => {
    const res = await fetch("/api/admin/slots");
    setSlots(await res.json());
  };

  const handleCreate = async () => {
    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Slot created");
      setDialogOpen(false);
      fetchSlots();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create slot");
    }
  };

  const cancelSlot = async (id: string) => {
    if (!confirm("Cancel this slot?")) return;
    const res = await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Slot cancelled");
      fetchSlots();
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-[#E6F0F6] text-[#3F6F5E]";
      case "PENDING_FILL": return "bg-yellow-50 text-yellow-700";
      case "CONFIRMED": return "bg-[#DDEFE6] text-[#3F6F5E]";
      case "COMPLETED": return "bg-gray-100 text-gray-600";
      case "CANCELLED": return "bg-red-50 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) return <p className="text-[#717171]">Loading slots...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[#2A2A2A]">
          Slots ({slots.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#3F6F5E] text-white rounded-full" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Create Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-playfair)]">Create Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#717171]">Club</Label>
                <Select value={form.clubId} onValueChange={(v) => setForm({ ...form, clubId: v })}>
                  <SelectTrigger className="border-[#F1F1F1] rounded-xl mt-1"><SelectValue placeholder="Select club" /></SelectTrigger>
                  <SelectContent>
                    {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#717171]">Start Time</Label>
                <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="border-[#F1F1F1] rounded-xl mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#717171]">Duration</Label>
                  <Select value={String(form.durationMins)} onValueChange={(v) => setForm({ ...form, durationMins: parseInt(v) })}>
                    <SelectTrigger className="border-[#F1F1F1] rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#717171]">Format</Label>
                  <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                    <SelectTrigger className="border-[#F1F1F1] rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLES">Singles (2)</SelectItem>
                      <SelectItem value="DOUBLES">Doubles (4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#717171]">Skill Level</Label>
                  <Select value={String(form.skillLevel)} onValueChange={(v) => setForm({ ...form, skillLevel: parseInt(v) })}>
                    <SelectTrigger className="border-[#F1F1F1] rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map((s) => <SelectItem key={s.value} value={String(s.value)}>{s.value} — {s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#717171]">Age Bracket</Label>
                  <Select value={form.ageBracket} onValueChange={(v) => setForm({ ...form, ageBracket: v })}>
                    <SelectTrigger className="border-[#F1F1F1] rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AGE_BRACKETS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#717171]">Total Cost (cents)</Label>
                <Input type="number" value={form.totalCostCents} onChange={(e) => setForm({ ...form, totalCostCents: parseInt(e.target.value) || 0 })} className="border-[#F1F1F1] rounded-xl mt-1" />
                <p className="text-xs text-[#717171] mt-1">500 = $5.00, 1000 = $10.00</p>
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#3F6F5E] text-white rounded-full">Create Slot</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {slots.map((slot) => {
          const joined = slot.participants.filter((p) => p.status === "JOINED").length;
          const waitlisted = slot.participants.filter((p) => p.status === "WAITLISTED").length;
          return (
            <Card key={slot.id} className="border-[#F1F1F1] rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[#2A2A2A] font-medium">{slot.club.name}</h3>
                    <Badge className={`${statusColor(slot.status)} border-0 rounded-full text-xs`}>{slot.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#717171]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(slot.startTime), "MMM d, h:mm a")}
                    </span>
                    <span>{slot.format} · {slot.durationMins}min</span>
                    <span>Lvl {slot.skillLevel}</span>
                    <span>{joined}/{slot.requiredPlayers} joined</span>
                    {waitlisted > 0 && <span className="text-yellow-600">{waitlisted} waitlisted</span>}
                    <span>${(slot.totalCostCents / 100).toFixed(2)} total</span>
                  </div>
                </div>
                {!["COMPLETED", "CANCELLED"].includes(slot.status) && (
                  <Button variant="outline" size="sm" className="rounded-full border-[#F1F1F1] text-red-500" onClick={() => cancelSlot(slot.id)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
