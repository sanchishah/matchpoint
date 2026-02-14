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
        <p className="text-[#717171]">Loading games...</p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = games.filter((g) => new Date(g.startTime) > now);
  const past = games.filter((g) => new Date(g.endTime) <= now);

  const GameCard = ({ game }: { game: GameData }) => (
    <Link href={`/games/${game.id}`}>
      <Card className="border-[#F1F1F1] rounded-2xl p-6 hover:shadow-sm transition-shadow cursor-pointer mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-[family-name:var(--font-playfair)] text-lg text-[#2A2A2A]">
              {game.slot.club.name}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#717171] mt-2">
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
            <Badge className="bg-[#DDEFE6] text-[#3F6F5E] border-0 rounded-full text-xs">
              {game.slot.format === "SINGLES" ? "Singles" : "Doubles"}
            </Badge>
            <Badge
              className={`border-0 rounded-full text-xs ${
                game.status === "CONFIRMED"
                  ? "bg-[#DDEFE6] text-[#3F6F5E]"
                  : game.status === "COMPLETED"
                  ? "bg-[#E6F0F6] text-[#4A4A4A]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {game.status}
            </Badge>
            <ChevronRight className="w-5 h-5 text-[#717171]" />
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-[#2A2A2A] mb-8 tracking-wide">
          My Games
        </h1>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6 bg-[#F8F8F8] rounded-full p-1">
            <TabsTrigger
              value="upcoming"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#3F6F5E] px-6"
            >
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#3F6F5E] px-6"
            >
              Past ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#717171]">No upcoming games.</p>
                <Link
                  href="/book"
                  className="text-[#3F6F5E] text-sm mt-2 inline-block hover:underline"
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
                <p className="text-[#717171]">No past games yet.</p>
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
