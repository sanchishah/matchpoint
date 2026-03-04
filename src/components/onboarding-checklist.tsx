"use client";

import Link from "next/link";
import { CheckCircle2, Circle, X, Mail, User, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OnboardingChecklistProps {
  emailVerified: boolean;
  hasProfile: boolean;
  hasJoinedSlot: boolean;
  onDismiss: () => void;
}

const steps = [
  { key: "emailVerified" as const, label: "Verify your email", href: "/verify-email", icon: Mail },
  { key: "hasProfile" as const, label: "Complete your profile", href: "/profile/setup", icon: User },
  { key: "hasJoinedSlot" as const, label: "Join your first game", href: "/book", icon: Trophy },
];

export function OnboardingChecklist({ emailVerified, hasProfile, hasJoinedSlot, onDismiss }: OnboardingChecklistProps) {
  const status = { emailVerified, hasProfile, hasJoinedSlot };
  const completed = steps.filter((s) => status[s.key]).length;

  if (completed === 3) return null;

  return (
    <Card className="border-[#E2E8F0] rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A]">
          Get Started
        </h2>
        <button
          onClick={onDismiss}
          className="text-[#64748B] hover:text-[#0A0A0A] transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full mb-5">
        <div
          className="h-1.5 bg-[#0B4F6C] rounded-full transition-all duration-300"
          style={{ width: `${(completed / 3) * 100}%` }}
        />
      </div>
      <p className="text-xs text-[#64748B] mb-4">{completed} of 3 complete</p>

      <div className="space-y-3">
        {steps.map((step) => {
          const done = status[step.key];
          const Icon = step.icon;
          const content = (
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[#E8F4F8] flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${done ? "text-[#64748B]" : "text-[#0B4F6C]"}`} />
              </div>
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-[#0B4F6C] shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-[#E2E8F0] shrink-0" />
              )}
              <span className={`text-sm ${done ? "line-through text-[#64748B]" : "text-[#333333]"}`}>
                {step.label}
              </span>
            </div>
          );

          if (done) {
            return <div key={step.key}>{content}</div>;
          }

          return (
            <Link key={step.key} href={step.href} className="block hover:bg-[#F8FAFC] rounded-lg px-2 -mx-2 transition-colors">
              {content}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
