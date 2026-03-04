"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, UserCheck, UserPlus, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DotLoader } from "@/components/dot-loader";
import { toast } from "sonner";
import { skillLabel } from "@/lib/constants";

interface FriendItem {
  id: string;
  friend: {
    id: string;
    name: string;
    skillLevel: number | null;
  };
  status: string;
  createdAt: string;
}

type Tab = "friends" | "received" | "sent";

export default function FriendsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [received, setReceived] = useState<FriendItem[]>([]);
  const [sent, setSent] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const [acceptedRes, pendingRes] = await Promise.all([
        fetch("/api/friends?status=accepted"),
        fetch("/api/friends?status=pending"),
      ]);

      if (acceptedRes.ok) {
        const data = await acceptedRes.json();
        setFriends(data);
      }

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setReceived(data.received || []);
        setSent(data.sent || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (session) fetchFriends();
  }, [session]);

  const respondToRequest = async (friendshipId: string, action: "ACCEPT" | "REJECT") => {
    setActionLoading(friendshipId);
    try {
      const res = await fetch(`/api/friends/${friendshipId}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error);
      } else {
        toast.success(action === "ACCEPT" ? "Friend request accepted!" : "Request rejected");
        fetchFriends();
      }
    } catch {
      toast.error("Failed to respond");
    } finally {
      setActionLoading(null);
    }
  };

  const unfriend = async (friendshipId: string) => {
    setActionLoading(friendshipId);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to unfriend");
      } else {
        toast.success("Unfriended");
        fetchFriends();
      }
    } catch {
      toast.error("Failed to unfriend");
    } finally {
      setActionLoading(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return <DotLoader />;
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "friends", label: "Friends", count: friends.length },
    { key: "received", label: "Received", count: received.length },
    { key: "sent", label: "Sent", count: sent.length },
  ];

  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-7 h-7 text-[#0B4F6C]" />
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] tracking-wide">
            Friends
          </h1>
        </div>
        <p className="text-[#64748B] mb-8">Manage your friends and friend requests.</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F1F5F9] rounded-full p-1 mb-8 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                tab === t.key ? "bg-white text-[#0B4F6C] shadow-sm font-medium" : "text-[#64748B]"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-[#E8F4F8] text-[#0B4F6C]" : "bg-[#E2E8F0] text-[#64748B]"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Friends List */}
        {tab === "friends" && (
          <div>
            {friends.length === 0 ? (
              <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
                <UserCheck className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
                <p className="text-[#64748B] mb-2">No friends yet</p>
                <p className="text-sm text-[#94A3B8]">
                  Play games with others and send them friend requests!
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {friends.map((f) => (
                  <Card key={f.id} className="border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/players/${f.friend.id}`} className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center text-sm font-medium text-[#0B4F6C]">
                          {f.friend.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0A0A0A] hover:text-[#0B4F6C] transition-colors">
                            {f.friend.name}
                          </p>
                          {f.friend.skillLevel !== null && (
                            <p className="text-xs text-[#64748B]">
                              {skillLabel(f.friend.skillLevel)}
                            </p>
                          )}
                        </div>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#E2E8F0] text-[#64748B] rounded-full text-xs"
                        onClick={() => unfriend(f.id)}
                        disabled={actionLoading === f.id}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Unfriend
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Received Requests */}
        {tab === "received" && (
          <div>
            {received.length === 0 ? (
              <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
                <UserPlus className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
                <p className="text-[#64748B]">No pending requests</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {received.map((f) => (
                  <Card key={f.id} className="border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/players/${f.friend.id}`} className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center text-sm font-medium text-[#0B4F6C]">
                          {f.friend.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0A0A0A]">{f.friend.name}</p>
                          {f.friend.skillLevel !== null && (
                            <p className="text-xs text-[#64748B]">
                              {skillLabel(f.friend.skillLevel)}
                            </p>
                          )}
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full text-xs"
                          onClick={() => respondToRequest(f.id, "ACCEPT")}
                          disabled={actionLoading === f.id}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#E2E8F0] text-[#64748B] rounded-full text-xs"
                          onClick={() => respondToRequest(f.id, "REJECT")}
                          disabled={actionLoading === f.id}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sent Requests */}
        {tab === "sent" && (
          <div>
            {sent.length === 0 ? (
              <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
                <Clock className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
                <p className="text-[#64748B]">No sent requests</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sent.map((f) => (
                  <Card key={f.id} className="border-[#E2E8F0] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/players/${f.friend.id}`} className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center text-sm font-medium text-[#0B4F6C]">
                          {f.friend.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0A0A0A]">{f.friend.name}</p>
                          {f.friend.skillLevel !== null && (
                            <p className="text-xs text-[#64748B]">
                              {skillLabel(f.friend.skillLevel)}
                            </p>
                          )}
                        </div>
                      </Link>
                      <Badge className="bg-[#F1F5F9] text-[#64748B] border-0 rounded-full text-xs">
                        Pending...
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
