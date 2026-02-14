"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

interface Club {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  notes: string | null;
  _count: { slots: number };
}

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "CA", zip: "", lat: 0, lng: 0, notes: "",
  });

  const fetchClubs = async () => {
    const res = await fetch("/api/admin/clubs");
    const data = await res.json();
    setClubs(data);
    setLoading(false);
  };

  useEffect(() => { fetchClubs(); }, []);

  const resetForm = () => {
    setForm({ name: "", address: "", city: "", state: "CA", zip: "", lat: 0, lng: 0, notes: "" });
    setEditing(null);
  };

  const handleSubmit = async () => {
    const url = editing ? `/api/admin/clubs/${editing.id}` : "/api/admin/clubs";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lat: Number(form.lat), lng: Number(form.lng) }),
    });

    if (res.ok) {
      toast.success(editing ? "Club updated" : "Club created");
      setDialogOpen(false);
      resetForm();
      fetchClubs();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this club? This will also delete all associated slots.")) return;
    const res = await fetch(`/api/admin/clubs/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Club deleted");
      fetchClubs();
    }
  };

  const openEdit = (club: Club) => {
    setEditing(club);
    setForm({
      name: club.name,
      address: club.address,
      city: club.city,
      state: club.state,
      zip: club.zip,
      lat: club.lat,
      lng: club.lng,
      notes: club.notes || "",
    });
    setDialogOpen(true);
  };

  if (loading) return <p className="text-[#717171]">Loading clubs...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[#2A2A2A]">
          Clubs ({clubs.length})
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#3F6F5E] text-white rounded-full" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-playfair)]">
                {editing ? "Edit Club" : "Add Club"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {[
                { key: "name", label: "Name", type: "text" },
                { key: "address", label: "Address", type: "text" },
                { key: "city", label: "City", type: "text" },
                { key: "zip", label: "Zip", type: "text" },
                { key: "lat", label: "Latitude", type: "number" },
                { key: "lng", label: "Longitude", type: "number" },
                { key: "notes", label: "Notes", type: "text" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <Label className="text-xs uppercase tracking-wider text-[#717171]">{label}</Label>
                  <Input
                    type={type}
                    value={(form as Record<string, string | number>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                    className="border-[#F1F1F1] rounded-xl mt-1"
                  />
                </div>
              ))}
              <Button onClick={handleSubmit} className="w-full bg-[#3F6F5E] text-white rounded-full">
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {clubs.map((club) => (
          <Card key={club.id} className="border-[#F1F1F1] rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[#2A2A2A] font-medium">{club.name}</h3>
                <p className="text-sm text-[#717171] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {club.address}, {club.city}, {club.state} {club.zip}
                </p>
                <p className="text-xs text-[#717171] mt-1">{club._count.slots} slots</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full border-[#F1F1F1]" onClick={() => openEdit(club)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-[#F1F1F1] text-red-500" onClick={() => handleDelete(club.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
