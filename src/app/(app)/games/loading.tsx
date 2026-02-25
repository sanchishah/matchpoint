import { Card } from "@/components/ui/card";

export default function GamesLoading() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-8 w-36 bg-[#F1F5F9] rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-[#E2E8F0] rounded-xl p-5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="h-5 w-44 bg-[#F1F5F9] rounded animate-pulse mb-2" />
                  <div className="h-4 w-56 bg-[#F1F5F9] rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-[#F1F5F9] rounded-full animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
