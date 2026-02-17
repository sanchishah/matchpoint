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
    { label: "Users", value: userCount, icon: Users, bg: "bg-[#E8F4F8]" },
    { label: "Clubs", value: clubCount, icon: MapPin, bg: "bg-[#F1F5F9]" },
    { label: "Slots", value: slotCount, icon: Calendar, bg: "bg-[#E8F4F8]" },
    { label: "Games", value: gameCount, icon: Calendar, bg: "bg-[#F1F5F9]" },
    {
      label: "Revenue",
      value: `$${((paymentSum._sum.amountCents || 0) / 100).toFixed(2)}`,
      icon: CreditCard,
      bg: "bg-[#E8F4F8]",
    },
    { label: "Messages", value: messageCount, icon: MessageSquare, bg: "bg-[#F1F5F9]" },
    { label: "Strikes", value: strikeCount, icon: AlertTriangle, bg: "bg-[#E8F4F8]" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-[#E2E8F0] rounded-xl p-6">
          <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
            <s.icon className="w-5 h-5 text-[#0B4F6C]" />
          </div>
          <p className="text-2xl font-light text-[#0A0A0A]">{s.value}</p>
          <p className="text-xs text-[#64748B] mt-1">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
