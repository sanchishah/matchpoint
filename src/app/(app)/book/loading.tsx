import { Card } from "@/components/ui/card";

export default function BookLoading() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-8 w-48 bg-[#F1F5F9] rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-11 bg-[#F1F5F9] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-[#E2E8F0] rounded-xl p-6">
              <div className="h-5 w-40 bg-[#F1F5F9] rounded animate-pulse mb-3" />
              <div className="h-4 w-64 bg-[#F1F5F9] rounded animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
