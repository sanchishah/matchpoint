"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Star, Trophy, Users, ArrowLeft, ChevronRight, UserPlus, UserCheck, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { skillLabel, ageBracketLabel } from "@/lib/constants";
import { toast } from "sonner";

interface PlayerProfile {
  id: string;
  name: string;
  skillLevel: number;
  ageBracket: string;
  gamesPlayed: number;
  avgRating: number;
  ratingCount: number;
  friendshipStatus: string | null;
  friendshipId: string | null;
  recentGames: {
    id: string;
    clubName: string;
    date: string;
    format: string;
  }[];
}

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);

  const fetchPlayer = () => {
    fetch(`/api/players/${id}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setPlayer(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlayer();
  }, [id]);

  const sendFriendRequest = async () => {
    setFriendLoading(true);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
      } else {
        toast.success("Friend request sent!");
        fetchPlayer();
      }
    } catch {
      toast.error("Failed to send friend request");
    } finally {
      setFriendLoading(false);
    }
  };

  const respondToRequest = async (action: "ACCEPT" | "REJECT") => {
    if (!player?.friendshipId) return;
    setFriendLoading(true);
    try {
      const res = await fetch(`/api/friends/${player.friendshipId}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error);
      } else {
        toast.success(action === "ACCEPT" ? "Friend request accepted!" : "Friend request rejected");
        fetchPlayer();
      }
    } catch {
      toast.error("Failed to respond to request");
    } finally {
      setFriendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading player...</p>
      </div>
    );
  }

  if (notFound || !player) {
    return (
      <div className="py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-4 tracking-wide">
            Player Not Found
          </h1>
          <p className="text-[#64748B] mb-6">This player profile does not exist or is not available.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="border-[#0B4F6C] text-[#0B4F6C] rounded-lg">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-[#0B4F6C] text-[#0B4F6C]" />
        );
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <div key={i} className="relative w-5 h-5">
            <Star className="w-5 h-5 text-[#E2E8F0] absolute" />
            <div className="overflow-hidden w-[50%] absolute">
              <Star className="w-5 h-5 fill-[#0B4F6C] text-[#0B4F6C]" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-5 h-5 text-[#E2E8F0]" />
        );
      }
    }
    return stars;
  };

  const renderFriendButton = () => {
    if (!session || session.user.id === id) return null;

    switch (player.friendshipStatus) {
      case "ACCEPTED":
        return (
          <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full px-4 py-2 text-sm">
            <UserCheck className="w-4 h-4 mr-1.5" /> Friends
          </Badge>
        );
      case "PENDING_SENT":
        return (
          <Badge className="bg-[#F1F5F9] text-[#64748B] border-0 rounded-full px-4 py-2 text-sm">
            <Clock className="w-4 h-4 mr-1.5" /> Request Pending
          </Badge>
        );
      case "PENDING_RECEIVED":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full text-sm"
              onClick={() => respondToRequest("ACCEPT")}
              disabled={friendLoading}
            >
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#E2E8F0] text-[#64748B] rounded-full text-sm"
              onClick={() => respondToRequest("REJECT")}
              disabled={friendLoading}
            >
              Reject
            </Button>
          </div>
        );
      default:
        return (
          <Button
            size="sm"
            className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full text-sm"
            onClick={sendFriendRequest}
            disabled={friendLoading}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            {friendLoading ? "Sending..." : "Add Friend"}
          </Button>
        );
    }
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[#0B4F6C] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Player Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F4F8] flex items-center justify-center text-2xl font-medium text-[#0B4F6C]">
              {player.name[0]}
            </div>
            <div className="flex-1">
              <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] tracking-wide">
                {player.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs">
                  {skillLabel(player.skillLevel)}
                </Badge>
                <Badge className="bg-[#F1F5F9] text-[#333333] border-0 rounded-full text-xs">
                  {ageBracketLabel(player.ageBracket)}
                </Badge>
              </div>
            </div>
            {renderFriendButton()}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Games Played
              </h2>
            </div>
            <p className="text-3xl font-light text-[#0A0A0A]">{player.gamesPlayed}</p>
          </Card>

          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Star className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Avg Rating
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {renderStars(player.avgRating)}
              </div>
              <span className="text-lg font-light text-[#0A0A0A]">
                {player.avgRating > 0 ? player.avgRating.toFixed(1) : "N/A"}
              </span>
            </div>
          </Card>

          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Total Ratings
              </h2>
            </div>
            <p className="text-3xl font-light text-[#0A0A0A]">{player.ratingCount}</p>
          </Card>
        </div>

        {/* Recent Games */}
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-5">
            Recent Games
          </h2>
          {player.recentGames.length === 0 ? (
            <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
              <p className="text-[#64748B]">No games played yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {player.recentGames.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="border-[#E2E8F0] rounded-xl p-5 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                          {game.clubName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[#64748B] mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(game.date), "EEE, MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs">
                          {game.format === "SINGLES" ? "Singles" : "Doubles"}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-[#64748B]" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
