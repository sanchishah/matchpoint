"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GameData {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  slot: {
    format: string;
    skillLevel: number;
    club: { name: string; city: string };
  };
  participants: { userId: string; user: { name: string | null } }[];
}

export default function GamesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/games")
      .then((r) => r.json())
      .then(setGames)
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading games...</p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = games.filter((g) => new Date(g.startTime) > now);
  const past = games.filter((g) => new Date(g.endTime) <= now);

  const GameCard = ({ game }: { game: GameData }) => (
    <Link href={`/games/${game.id}`}>
      <Card className="border-[#E2E8F0] rounded-xl p-6 hover:shadow-sm transition-shadow cursor-pointer mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
              {game.slot.club.name}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B] mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(game.startTime), "EEE, MMM d · h:mm a")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {game.slot.club.city}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {game.participants.length} players
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full text-xs">
              {game.slot.format === "SINGLES" ? "Singles" : "Doubles"}
            </Badge>
            <Badge
              className={`border-0 rounded-full text-xs ${
                game.status === "CONFIRMED"
                  ? "bg-[#E8F4F8] text-[#0B4F6C]"
                  : game.status === "COMPLETED"
                  ? "bg-[#F1F5F9] text-[#333333]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {game.status}
            </Badge>
            <ChevronRight className="w-5 h-5 text-[#64748B]" />
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-8 tracking-wide">
          My Games
        </h1>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6 bg-[#F8F8F8] rounded-full p-1">
            <TabsTrigger
              value="upcoming"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#0B4F6C] px-6"
            >
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#0B4F6C] px-6"
            >
              Past ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#64748B]">No upcoming games.</p>
                <Link
                  href="/book"
                  className="text-[#0B4F6C] text-sm mt-2 inline-block hover:underline"
                >
                  Browse available courts
                </Link>
              </div>
            ) : (
              upcoming.map((g) => <GameCard key={g.id} game={g} />)
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#64748B]">No past games yet.</p>
              </div>
            ) : (
              past.map((g) => <GameCard key={g.id} game={g} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
