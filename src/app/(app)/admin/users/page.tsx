"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, ShieldOff, Trash2 } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  profile: { name: string; skillLevel: number; ageBracket: string } | null;
  _count: { strikes: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateUser = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      toast.success("User updated");
      fetchUsers();
    } else {
      toast.error("Failed to update user");
    }
  };

  if (loading) return <p className="text-[#64748B]">Loading users...</p>;

  return (
    <div>
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-6">
        Users ({users.length})
      </h2>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id} className="border-[#E2E8F0] rounded-xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[#0A0A0A] font-medium">
                    {user.profile?.name || user.name || "No name"}
                  </h3>
                  {user.role === "ADMIN" && (
                    <Badge className="bg-[#0B4F6C] text-white border-0 rounded-full text-[10px]">Admin</Badge>
                  )}
                  <Badge className={`border-0 rounded-full text-[10px] ${
                    user.status === "ACTIVE" ? "bg-[#E8F4F8] text-[#0B4F6C]" : "bg-red-50 text-red-600"
                  }`}>{user.status}</Badge>
                </div>
                <p className="text-sm text-[#64748B] mt-1">{user.email}</p>
                <div className="flex gap-3 text-xs text-[#64748B] mt-1">
                  {user.profile && (
                    <>
                      <span>Skill: {user.profile.skillLevel}</span>
                      <span>Age: {user.profile.ageBracket.replace("AGE_", "").replace("_", "-")}</span>
                    </>
                  )}
                  <span>Strikes: {user._count.strikes}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {user.status === "ACTIVE" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#E2E8F0] text-red-500 text-xs"
                    onClick={() => updateUser(user.id, { status: "RESTRICTED" })}
                  >
                    <ShieldOff className="w-3.5 h-3.5 mr-1" /> Restrict
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#E2E8F0] text-[#0B4F6C] text-xs"
                    onClick={() => updateUser(user.id, { status: "ACTIVE", clearStrikes: true })}
                  >
                    <Shield className="w-3.5 h-3.5 mr-1" /> Unrestrict
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
