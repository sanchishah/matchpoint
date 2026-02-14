import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function InfoPage() {
  const items = [
    {
      title: "Matchpoint is free to use",
      desc: "There are no subscription fees or hidden charges. Creating your account, browsing courts, and getting matched with players is completely free.",
    },
    {
      title: "You only pay for the court you play on",
      desc: "When a game is confirmed with enough players, each participant pays their share of the court cost. Singles players split the cost two ways; doubles players split it four ways.",
    },
    {
      title: "All court payments are non-refundable",
      desc: "Once a game is confirmed and payment is processed, court fees cannot be refunded. Please make sure you can attend before reserving your spot.",
    },
  ];

  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#2A2A2A] mb-4 tracking-wide">
            Good to Know Before You Play
          </h1>
          <p className="text-[#717171] max-w-md mx-auto">
            A few things to keep in mind as you get started with Matchpoint.
          </p>
        </div>

        <div className="space-y-6">
          {items.map((item) => (
            <Card key={item.title} className="border-[#F1F1F1] rounded-2xl p-8">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#DDEFE6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-[#3F6F5E]" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[#2A2A2A] mb-2">
                    {item.title}
                  </h2>
                  <p className="text-[#4A4A4A] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
