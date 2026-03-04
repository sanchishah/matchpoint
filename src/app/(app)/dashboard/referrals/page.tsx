"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Gift, Copy, Check, Users, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DotLoader } from "@/components/dot-loader";

interface ReferralData {
  refereeEmail: string;
  createdAt: string;
  credited: boolean;
}

interface ReferralsResponse {
  referralCode: string;
  referralCredits: number;
  referrals: ReferralData[];
}

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const fetchReferrals = async () => {
      try {
        const res = await fetch("/api/referrals");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [session]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || "";
  const shareLink = data
    ? `${baseUrl}/signup?ref=${data.referralCode}`
    : "";

  const copyToClipboard = useCallback(
    async (text: string, type: "code" | "link") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        toast.success(type === "code" ? "Code copied!" : "Link copied!");
        setTimeout(() => setCopied(null), 2000);
      } catch {
        toast.error("Failed to copy");
      }
    },
    []
  );

  if (status === "loading" || loading) {
    return <DotLoader />;
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] mb-8 tracking-wide">
          Referrals
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Referral Code Card */}
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Gift className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Your Code
              </h2>
            </div>
            {data ? (
              <div>
                <div className="flex items-center gap-2">
                  <code className="font-[family-name:var(--font-inter)] text-xl font-semibold text-[#0B4F6C] tracking-widest bg-[#E8F4F8] px-4 py-2 rounded-lg">
                    {data.referralCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-[#E2E8F0] h-10 w-10 p-0"
                    onClick={() =>
                      copyToClipboard(data.referralCode, "code")
                    }
                  >
                    {copied === "code" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#64748B]" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-[#64748B] mt-3">
                  Share this code with friends to earn credits
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">
                Unable to load referral code
              </p>
            )}
          </Card>

          {/* Shareable Link Card */}
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Share Link
              </h2>
            </div>
            {data ? (
              <div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#333333] font-[family-name:var(--font-inter)] break-all">
                  {shareLink}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-lg border-[#E2E8F0] text-xs font-[family-name:var(--font-inter)]"
                  onClick={() => copyToClipboard(shareLink, "link")}
                >
                  {copied === "link" ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">
                Unable to load share link
              </p>
            )}
          </Card>

          {/* Credits Card */}
          <Card className="border-[#E2E8F0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E8F4F8] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B4F6C]" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
                Credits
              </h2>
            </div>
            <p className="text-3xl font-light text-[#0A0A0A]">
              {data?.referralCredits ?? 0}
            </p>
            <p className="text-xs text-[#64748B] mt-2">
              Earned when your referrals play their first game
            </p>
          </Card>
        </div>

        {/* Referral List */}
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-5">
            Your Referrals
          </h2>
          {!data || data.referrals.length === 0 ? (
            <Card className="border-[#E2E8F0] rounded-xl p-8 text-center">
              <p className="text-[#64748B] font-[family-name:var(--font-inter)]">
                No referrals yet. Share your code to get started!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.referrals.map((referral, i) => (
                <Card
                  key={i}
                  className="border-[#E2E8F0] rounded-xl p-5"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[#0A0A0A]">
                        {referral.refereeEmail}
                      </p>
                      <p className="text-sm text-[#64748B] font-[family-name:var(--font-inter)] mt-0.5">
                        Joined{" "}
                        {new Date(referral.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <Badge
                      className={`rounded-full text-xs border-0 ${
                        referral.credited
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {referral.credited ? "Credited" : "Pending"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
