"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Calendar, MapPin, Clock, Users, Send, Star, MessageCircle, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SKILL_LEVELS } from "@/lib/constants";

interface GameDetail {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  chatOpen: boolean;
  chatOpenTime: string;
  isParticipant: boolean;
  isAdmin: boolean;
  slot: {
    format: string;
    skillLevel: number;
    ageBracket: string;
    durationMins: number;
    totalCostCents: number;
    requiredPlayers: number;
    club: { name: string; address: string; city: string };
  };
  participants: {
    userId: string;
    user: {
      id: string;
      name: string | null;
      profile: { name: string; skillLevel: number; ageBracket: string } | null;
    };
  }[];
  payments: { amountCents: number; status: string }[];
  ratings: { rateeId: string; stars: number; feltLevel: string }[];
  messages: {
    id: string;
    body: string;
    createdAt: string;
    user: { id: string; name: string | null; profile: { name: string } | null };
  }[];
}

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(3);
  const [feltLevel, setFeltLevel] = useState("AT");
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/games/${id}`);
      if (!res.ok) {
        router.push("/games");
        return;
      }
      const data = await res.json();
      setGame(data);
    } catch {
      router.push("/games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [game?.messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/games/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: message }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error);
      } else {
        setMessage("");
        fetchGame();
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const submitRating = async (rateeId: string) => {
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/games/${id}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateeId,
          stars: ratingStars,
          feltLevel,
          comment: ratingComment || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error);
      } else {
        toast.success("Rating submitted");
        setShowRating(null);
        setRatingComment("");
        fetchGame();
      }
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading || !game) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading game...</p>
      </div>
    );
  }

  const now = new Date();
  const isPast = now > new Date(game.endTime);
  const skillLabel = SKILL_LEVELS.find((s) => s.value === game.slot.skillLevel)?.label || "";

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-2 tracking-wide">
            {game.slot.club.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(game.startTime), "EEEE, MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(new Date(game.startTime), "h:mm a")} – {format(new Date(game.endTime), "h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {game.slot.club.address}, {game.slot.club.city}
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge className="bg-[#E8F4F8] text-[#0B4F6C] border-0 rounded-full">
              {game.slot.format === "SINGLES" ? "Singles" : "Doubles"}
            </Badge>
            <Badge className="bg-[#F1F5F9] text-[#0B4F6C] border-0 rounded-full">
              Lvl {game.slot.skillLevel} · {skillLabel}
            </Badge>
            <Badge
              className={`border-0 rounded-full ${
                game.status === "CONFIRMED" ? "bg-[#E8F4F8] text-[#0B4F6C]" :
                game.status === "COMPLETED" ? "bg-[#F1F5F9] text-[#333333]" :
                "bg-red-50 text-red-600"
              }`}
            >
              {game.status}
            </Badge>
          </div>
          {game.payments.length > 0 && (
            <p className="text-sm text-[#64748B] mt-2">
              Your share: ${(game.payments[0].amountCents / 100).toFixed(2)} · {game.payments[0].status}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Participants + Ratings */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-[#E2E8F0] rounded-xl p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0B4F6C]" /> Players
              </h2>
              <div className="space-y-4">
                {game.participants.map((p) => {
                  const playerName = p.user.profile?.name || p.user.name || "Player";
                  const existingRating = game.ratings.find((r) => r.rateeId === p.userId);
                  const isMe = p.userId === session?.user?.id;

                  return (
                    <div key={p.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E8F4F8] flex items-center justify-center text-sm font-medium text-[#0B4F6C]">
                          {playerName[0]}
                        </div>
                        <div>
                          <p className="text-sm text-[#0A0A0A]">
                            {playerName} {isMe && <span className="text-[#64748B]">(you)</span>}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            Lvl {p.user.profile?.skillLevel || "?"}
                          </p>
                        </div>
                      </div>
                      {isPast && !isMe && (
                        <div>
                          {existingRating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-[#0B4F6C] text-[#0B4F6C]" />
                              <span className="text-xs text-[#0B4F6C]">{existingRating.stars}</span>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-[#0B4F6C] text-[#0B4F6C] rounded-full h-7 px-3"
                              onClick={() => {
                                setShowRating(p.userId);
                                setRatingStars(3);
                                setFeltLevel("AT");
                                setRatingComment("");
                              }}
                            >
                              Rate
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Rating Form */}
            {showRating && (
              <Card className="border-[#E2E8F0] rounded-xl p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#0B4F6C]" /> Rate Player
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-[#64748B] mb-2 block">Stars</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setRatingStars(s)}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              s <= ratingStars
                                ? "fill-[#0B4F6C] text-[#0B4F6C]"
                                : "text-[#E2E8F0]"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-[#64748B] mb-2 block">
                      Felt like their level?
                    </Label>
                    <RadioGroup value={feltLevel} onValueChange={setFeltLevel} className="flex gap-3">
                      {["BELOW", "AT", "ABOVE"].map((v) => (
                        <label
                          key={v}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-colors ${
                            feltLevel === v
                              ? "border-[#0B4F6C] bg-[#E8F4F8] text-[#0B4F6C]"
                              : "border-[#E2E8F0] text-[#64748B]"
                          }`}
                        >
                          <RadioGroupItem value={v} className="sr-only" />
                          <span className="text-sm">{v === "BELOW" ? "Below" : v === "AT" ? "At Level" : "Above"}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-[#64748B] mb-2 block">
                      Comment (optional)
                    </Label>
                    <Textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="How was the game?"
                      className="border-[#E2E8F0] rounded-xl resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full flex-1"
                      onClick={() => submitRating(showRating)}
                      disabled={submittingRating}
                    >
                      {submittingRating ? "Submitting..." : "Submit Rating"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#E2E8F0] rounded-full"
                      onClick={() => setShowRating(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-2">
            <Card className="border-[#E2E8F0] rounded-xl p-6 h-full flex flex-col">
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-1 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#0B4F6C]" /> Game Chat
              </h2>
              <p className="text-xs text-[#64748B] mb-4">
                {game.chatOpen
                  ? "Chat is open"
                  : isPast
                  ? "Chat has closed"
                  : `Chat opens ${formatDistanceToNow(new Date(game.chatOpenTime), { addSuffix: true })}`}
              </p>

              <Separator className="mb-4" />

              {/* Messages */}
              <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto space-y-3 mb-4">
                {game.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[#64748B] text-sm">
                      {game.chatOpen ? "No messages yet. Say hello!" : "Chat will appear here."}
                    </p>
                  </div>
                ) : (
                  game.messages.map((msg) => {
                    const isMe = msg.user.id === session?.user?.id;
                    const name = msg.user.profile?.name || msg.user.name || "Player";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                            isMe
                              ? "bg-[#0B4F6C] text-white"
                              : "bg-[#F8F8F8] text-[#333333]"
                          }`}
                        >
                          {!isMe && (
                            <p className="text-xs font-medium mb-0.5 opacity-70">{name}</p>
                          )}
                          <p className="text-sm">{msg.body}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-[#64748B]"}`}>
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              {game.chatOpen && (
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="border-[#E2E8F0] rounded-full"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />
                  <Button
                    className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-full px-4"
                    onClick={sendMessage}
                    disabled={sending || !message.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
