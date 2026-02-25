"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    setIsResending(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to resend verification email.");
        return;
      }

      if (data.alreadyVerified) {
        toast.success("Your email is already verified!");
        return;
      }

      setResent(true);
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  if (verified) {
    return (
      <Card className="border-[#E2E8F0] shadow-none">
        <CardHeader className="pb-2 pt-8 px-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-[#0B4F6C]" />
          </div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#333333] text-center">
            Email Verified
          </h2>
          <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60 text-center mt-1">
            Your email has been successfully verified.
          </p>
        </CardHeader>

        <CardContent className="px-8 pt-4">
          <div className="pt-2">
            <Link href="/login">
              <Button className="w-full rounded-lg bg-[#0B4F6C] px-8 py-3 h-12 text-white font-[family-name:var(--font-inter)] text-sm tracking-wide hover:bg-[#0B4F6C]/90 transition-colors">
                Continue to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>

        <CardFooter className="justify-center pb-8 px-8" />
      </Card>
    );
  }

  return (
    <Card className="border-[#E2E8F0] shadow-none">
      <CardHeader className="pb-2 pt-8 px-8">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-[#0B4F6C]" />
        </div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[#333333] text-center">
          Check Your Email
        </h2>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60 text-center mt-1">
          We sent a verification link to your email address. Click the link to
          verify your account.
        </p>
      </CardHeader>

      <CardContent className="px-8 pt-4">
        <div className="rounded-lg border border-[#E2E8F0] bg-[#f7f5f2] p-4 mb-6">
          <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/80 text-center">
            The link will expire in 24 hours. If you don&apos;t see the email,
            check your spam folder.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleResend}
            disabled={isResending || resent}
            variant="outline"
            className="w-full rounded-lg border-[#E2E8F0] px-8 py-3 h-12 font-[family-name:var(--font-inter)] text-sm tracking-wide text-[#333333] hover:bg-[#f7f5f2] transition-colors"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resent ? (
              "Email Sent"
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </div>
      </CardContent>

      <CardFooter className="justify-center pb-8 px-8">
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#333333]/60">
          Already verified?{" "}
          <Link
            href="/login"
            className="text-[#0B4F6C] font-medium hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
