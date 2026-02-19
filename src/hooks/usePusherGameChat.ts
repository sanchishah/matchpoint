"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher/client";

interface ChatMessage {
  id: string;
  gameId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; profile: { name: string } | null };
}

export function usePusherGameChat(
  gameId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-game-${gameId}`);

    channel.bind("message:new", (msg: ChatMessage) => {
      if (seenIds.current.has(msg.id)) return;
      seenIds.current.add(msg.id);
      onNewMessage(msg);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-game-${gameId}`);
    };
  }, [gameId, onNewMessage]);
}
