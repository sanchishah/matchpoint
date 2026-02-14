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
  const [strikes, setStrikes] = useState(0);
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
        <p className="text-[#717171]">Loading...</p>
      </div>
    );
  }

  const upcomingGames = games.filter((g) => new Date(g.startTime) > new Date());
  const pastGames = games.filter((g) => new Date(g.endTime) <= new Date());

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-[#2A2A2A] mb-8 tracking-wide">
          Welcome back{profile ? `, ${profile.name}` : ""}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Profile Card */}
          <Card className="border-[#F1F1F1] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#DDEFE6] flex items-center justify-center">
                <User className="w-5 h-5 text-[#3F6F5E]" />
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-lg text-[#2A2A2A]">
                Your Profile
              </h2>
            </div>
            {profile ? (
              <div className="space-y-2 text-sm text-[#4A4A4A]">
                <p>Skill Level: <strong>{profile.skillLevel}</strong></p>
                <p>Radius: <strong>{profile.radiusMiles} mi</strong></p>
                <p>Zip: <strong>{profile.zip}</strong></p>
                <Link href="/profile/setup">
                  <Button variant="outline" size="sm" className="mt-3 rounded-full border-[#F1F1F1] text-xs">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-[#717171] mb-3">Complete your profile to start playing</p>
                <Link href="/profile/setup">
                  <Button className="bg-[#3F6F5E] text-white rounded-full text-sm">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Browse CTA */}
          <Card className="border-[#F1F1F1] rounded-2xl p-6 bg-[#DDEFE6]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center">
                <Search className="w-5 h-5 text-[#3F6F5E]" />
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-lg text-[#2A2A2A]">
                Find a Game
              </h2>
            </div>
            <p className="text-sm text-[#4A4A4A] mb-4">Browse available courts and reserve your spot.</p>
            <Link href="/book">
              <Button className="bg-[#3F6F5E] hover:bg-[#345C4E] text-white rounded-full text-sm">
                Browse Courts
              </Button>
            </Link>
          </Card>

          {/* Strikes */}
          <Card className="border-[#F1F1F1] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E6F0F6] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#3F6F5E]" />
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-lg text-[#2A2A2A]">
                Strikes
              </h2>
            </div>
            <p className="text-3xl font-light text-[#2A2A2A]">{strikes} / 3</p>
            <p className="text-xs text-[#717171] mt-2">No-show strikes. 3 strikes = restricted.</p>
          </Card>
        </div>

        {/* Upcoming Games */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#2A2A2A]">
              Upcoming Games
            </h2>
            <Link href="/games" className="text-sm text-[#3F6F5E] flex items-center gap-1 hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {upcomingGames.length === 0 ? (
            <Card className="border-[#F1F1F1] rounded-2xl p-8 text-center">
              <p className="text-[#717171]">No upcoming games yet.</p>
              <Link href="/book">
                <Button variant="outline" className="mt-4 border-[#3F6F5E] text-[#3F6F5E] rounded-full">
                  Find a Game
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingGames.slice(0, 3).map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="border-[#F1F1F1] rounded-2xl p-5 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-[family-name:var(--font-playfair)] text-lg text-[#2A2A2A]">
                          {game.slot.club.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[#717171] mt-1">
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
                        <Badge className="bg-[#DDEFE6] text-[#3F6F5E] border-0 rounded-full text-xs">
                          {game.slot.format === "SINGLES" ? "Singles" : "Doubles"}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-[#717171]" />
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
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-[#2A2A2A] mb-5">
              Past Games
            </h2>
            <div className="space-y-3">
              {pastGames.slice(0, 5).map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="border-[#F1F1F1] rounded-2xl p-4 hover:shadow-sm transition-shadow cursor-pointer opacity-80">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[#2A2A2A]">{game.slot.club.name}</p>
                        <p className="text-sm text-[#717171]">
                          {format(new Date(game.startTime), "MMM d, yyyy")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#717171]" />
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
