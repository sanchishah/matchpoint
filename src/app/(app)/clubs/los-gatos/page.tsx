import type { Metadata } from "next";
import LosGatosClient from "./los-gatos-client";

export const metadata: Metadata = {
  title: "Play Pickleball at Addison-Penzak JCC, Los Gatos | MatchPoint",
  description:
    "Join organized pickleball games at Addison-Penzak JCC in Los Gatos. Skill-matched play, pre-booked courts, and a welcoming community. Reserve your spot today.",
};

export default function LosGatosPage() {
  return <LosGatosClient />;
}
