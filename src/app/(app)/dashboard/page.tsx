"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, AlertTriangle, ChevronRight, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  name: string;
  skillLevel: number;
  ageBracket: string;
  radiusMiles: number;
  zip: string;
  strikeCount?: number;
}

interface GameData {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  slot: {
    format: string;
    club: { name: string; city: string };
  };
  participants: { userId: string }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      try {
        const [profileRes, gamesRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/games"),
        ]);

        if (profileRes.ok) {
          const p = await profileRes.json();
          setProfile(p);
        }

        if (gamesRes.ok) {
          const g = await gamesRes.json();
          setGames(g);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };

    fetchData();
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading...</p>
      </div>
    );
  }

  const upcomingGames = games.filter((g) => new Date(g.startTime) > new Date());
  const pastGames = games.filter((g) => new Date(g.endTime) <= new Date());

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-8 tracking-wide">
          Welcome back{profile ? `, ${profile.name}` : ""}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Profile Card */}
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <User className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Your Profile
              </h2>
            </div>
            {profile ? (
              <div className="space-y-2 text-sm text-[#333333]">
                <p>Skill Level: <strong>{profile.skillLevel}</strong></p>
                <p>Radius: <strong>{profile.radiusMiles} mi</strong></p>
                <p>Zip: <strong>{profile.zip}</strong></p>
                <Link href="/profile/setup">
                  <Button variant="outline" size="sm" className="mt-3 rounded-lg border-[#E2E8F0] text-xs">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-[#64748B] mb-3">Complete your profile to start playing</p>
                <Link href="/profile/setup">
                  <Button className="bg-[#0B4F6C] text-white rounded-lg text-sm">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Browse CTA */}
          <Card className="border-[#E2E8F0] rounded-xl p-6 bg-[#E8F4F8]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center">
                <Search className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Find a Game
              </h2>
            </div>
            <p className="text-sm text-[#333333] mb-4">Browse available courts and reserve your spot.</p>
            <Link href="/book">
              <Button className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-sm">
                Browse Courts
              </Button>
            </Link>
          </Card>

          {/* Strikes */}
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Strikes
              </h2>
            </div>
            <p className="text-3xl font-light text-[#0A0A0A]">{profile?.strikeCount ?? 0} / 3</p>
            <p className="text-xs text-[#64748B] mt-2">No-show strikes. 3 strikes = restricted.</p>
          </Card>
        </div>

        {/* Upcoming Games */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A]">
              Upcoming Games
            </h2>
            <Link href="/games" className="text-sm text-[#0B4F6C] flex items-center gap-1 hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {upcomingGames.length === 0 ? (
            <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
              <p className="text-[#64748B]">No upcoming games yet.</p>
              <Link href="/book">
                <Button variant="outline" className="mt-4 border-[#0B4F6C] text-[#0B4F6C] rounded-lg">
                  Find a Game
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingGames.slice(0, 3).map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="border-[#E2E8F0] rounded-xl p-5 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                          {game.slot.club.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[#64748B] mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(game.startTime), "EEE, MMM d · h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {game.slot.club.city}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs">
                          {game.slot.format === "SINGLES" ? "Singles" : "Doubles"}
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

        {/* Past Games */}
        {pastGames.length > 0 && (
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-5">
              Past Games
            </h2>
            <div className="space-y-3">
              {pastGames.slice(0, 5).map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="border-[#E2E8F0] rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer opacity-80">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[#0A0A0A]">{game.slot.club.name}</p>
                        <p className="text-sm text-[#64748B]">
                          {format(new Date(game.startTime), "MMM d, yyyy")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#64748B]" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
