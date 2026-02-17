import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const navItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/clubs", label: "Clubs" },
    { href: "/admin/slots", label: "Slots" },
    { href: "/admin/games", label: "Games" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/messages", label: "Messages" },
  ];

  return (
    <div className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[#0A0A0A] tracking-wide">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm rounded-lg border border-[#E2E8F0] text-[#333333] hover:bg-[#E8F4F8] hover:text-[#0B4F6C] hover:border-[#0B4F6C] transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
