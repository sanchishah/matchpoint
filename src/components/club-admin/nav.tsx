"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Lightbulb,
} from "lucide-react";

const navItems = [
  { href: "/club-admin", label: "Overview", icon: LayoutDashboard },
  { href: "/club-admin/sessions", label: "Sessions", icon: Calendar },
  { href: "/club-admin/players", label: "Players", icon: Users },
  { href: "/club-admin/insights", label: "Insights", icon: Lightbulb },
];

export function ClubAdminNav({ clubName }: { clubName: string }) {
  const pathname = usePathname();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] tracking-wide">
            Club Dashboard
          </h1>
          <p className="text-sm text-[#64748B] mt-1">{clubName}</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/club-admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[#0B4F6C] text-white border-[#0B4F6C]"
                  : "border-[#E2E8F0] text-[#333333] hover:bg-[#E8F4F8] hover:text-[#0B4F6C] hover:border-[#0B4F6C]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
