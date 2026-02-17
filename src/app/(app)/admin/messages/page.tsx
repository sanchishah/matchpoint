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
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-6">
        Contact Messages ({messages.length})
      </h2>

      {messages.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
          <p className="text-[#64748B]">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id} className="border-[#E2E8F0] rounded-xl p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-[#0A0A0A] font-medium">{msg.name}</h3>
                  <p className="text-sm text-[#64748B]">{msg.email}</p>
                </div>
                <span className="text-xs text-[#64748B]">
                  {format(msg.createdAt, "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm text-[#333333] leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
