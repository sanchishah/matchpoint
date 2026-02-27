"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ClubInfo {
  name: string;
  address: string;
  city: string;
  state: string;
}

function InviteContent() {
  const searchParams = useSearchParams();
  const clubSlug = searchParams.get("club");
  const [club, setClub] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(!!clubSlug);

  useEffect(() => {
    if (!clubSlug) return;
    fetch(`/api/clubs/by-slug/${clubSlug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setClub(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-md px-6">
        <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-3 tracking-wide">
            You&apos;ve been invited to play pickleball!
          </h1>

          {club ? (
            <div className="bg-[#E8F4F8] rounded-lg p-4 mb-6 mt-6">
              <p className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                {club.name}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-sm text-[#64748B] mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{club.address}, {club.city}, {club.state}</span>
              </div>
            </div>
          ) : (
            <p className="text-[#333333] mt-4 mb-6">
              Join MatchPoint — organized, skill-matched pickleball in the South Bay.
            </p>
          )}

          <Link href={clubSlug ? `/signup?club=${clubSlug}` : "/signup"}>
            <Button className="w-full bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-base h-12 mb-3">
              Sign Up &amp; Play
            </Button>
          </Link>

          <p className="text-sm text-[#64748B]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0B4F6C] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-[#64748B]">Loading...</p>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
