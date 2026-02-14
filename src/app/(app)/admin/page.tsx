import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Users, Calendar, CreditCard, MessageSquare, AlertTriangle, MapPin } from "lucide-react";

export default async function AdminOverviewPage() {
  const [userCount, clubCount, slotCount, gameCount, paymentSum, messageCount, strikeCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.club.count(),
      prisma.slot.count(),
      prisma.game.count(),
      prisma.payment.aggregate({ _sum: { amountCents: true }, where: { status: "SUCCEEDED" } }),
      prisma.contactMessage.count(),
      prisma.strike.count(),
    ]);

  const stats = [
    { label: "Users", value: userCount, icon: Users, bg: "bg-[#DDEFE6]" },
    { label: "Clubs", value: clubCount, icon: MapPin, bg: "bg-[#E6F0F6]" },
    { label: "Slots", value: slotCount, icon: Calendar, bg: "bg-[#DDEFE6]" },
    { label: "Games", value: gameCount, icon: Calendar, bg: "bg-[#E6F0F6]" },
    {
      label: "Revenue",
      value: `$${((paymentSum._sum.amountCents || 0) / 100).toFixed(2)}`,
      icon: CreditCard,
      bg: "bg-[#DDEFE6]",
    },
    { label: "Messages", value: messageCount, icon: MessageSquare, bg: "bg-[#E6F0F6]" },
    { label: "Strikes", value: strikeCount, icon: AlertTriangle, bg: "bg-[#DDEFE6]" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-[#F1F1F1] rounded-2xl p-6">
          <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
            <s.icon className="w-5 h-5 text-[#3F6F5E]" />
          </div>
          <p className="text-2xl font-light text-[#2A2A2A]">{s.value}</p>
          <p className="text-xs text-[#717171] mt-1">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
