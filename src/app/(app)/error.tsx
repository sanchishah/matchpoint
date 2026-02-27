"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <Card className="border-[#E2E8F0] rounded-xl p-8 text-center max-w-md">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] mb-2">
          Something went wrong
        </h2>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#64748B] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Button
          onClick={reset}
          className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg text-sm"
        >
          Try Again
        </Button>
      </Card>
    </div>
  );
}
