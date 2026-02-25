import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-6xl font-bold text-[#0B4F6C] mb-4">
        404
      </h1>
      <p className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-2">
        Page Not Found
      </p>
      <p className="font-[family-name:var(--font-inter)] text-sm text-[#64748B] mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard">
        <Button className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-sm">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
