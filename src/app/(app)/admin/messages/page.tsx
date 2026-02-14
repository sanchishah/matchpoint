import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Mail } from "lucide-react";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[#2A2A2A] mb-6">
        Contact Messages ({messages.length})
      </h2>

      {messages.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-10 h-10 text-[#717171] mx-auto mb-3" />
          <p className="text-[#717171]">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id} className="border-[#F1F1F1] rounded-2xl p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-[#2A2A2A] font-medium">{msg.name}</h3>
                  <p className="text-sm text-[#717171]">{msg.email}</p>
                </div>
                <span className="text-xs text-[#717171]">
                  {format(msg.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
