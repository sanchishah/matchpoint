"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EmailPreferences {
  gameConfirmations: boolean;
  reminders: boolean;
  chatNotifications: boolean;
  marketing: boolean;
  referralUpdates: boolean;
}

const prefLabels: { key: keyof EmailPreferences; label: string; description: string }[] = [
  { key: "gameConfirmations", label: "Game Confirmations", description: "Emails when a game is confirmed or a spot is reserved" },
  { key: "reminders", label: "Game Reminders", description: "24-hour and 2-hour reminders before your games" },
  { key: "chatNotifications", label: "Chat Notifications", description: "Emails when game chat opens" },
  { key: "marketing", label: "Marketing", description: "Updates about new features and promotions" },
  { key: "referralUpdates", label: "Referral Updates", description: "Notifications about your referral rewards" },
];

export default function SettingsPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [prefs, setPrefs] = useState<EmailPreferences>({
    gameConfirmations: true,
    reminders: true,
    chatNotifications: true,
    marketing: true,
    referralUpdates: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    fetch("/api/profile/email-preferences")
      .then((res) => res.json())
      .then((data) => setPrefs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const togglePref = async (key: keyof EmailPreferences) => {
    const newValue = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: newValue }));

    try {
      const res = await fetch("/api/profile/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) throw new Error();
      toast.success("Preference updated");
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: !newValue }));
      toast.error("Failed to update preference");
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#64748B]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-7 h-7 text-[#0B4F6C]" />
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-[#0A0A0A] tracking-wide">
            Settings
          </h1>
        </div>
        <p className="text-[#64748B] mb-8">Manage your notification preferences.</p>

        <Card className="border-[#E2E8F0] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="w-5 h-5 text-[#0B4F6C]" />
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A]">
              Email Preferences
            </h2>
          </div>

          <div className="space-y-6">
            {prefLabels.map((pref) => (
              <div key={pref.key} className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-[#0A0A0A]">{pref.label}</Label>
                  <p className="text-xs text-[#64748B] mt-0.5">{pref.description}</p>
                </div>
                <Switch
                  checked={prefs[pref.key]}
                  onCheckedChange={() => togglePref(pref.key)}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
