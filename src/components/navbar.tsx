"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Gamepad2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notification-bell";

const navLinks = [
  { href: "/home", label: "Home" },
  { href: "/book", label: "Book" },
  { href: "/home#how-it-works", label: "How It Works" },
];

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-1 text-xl font-semibold tracking-tight text-[#0B4F6C] font-[family-name:var(--font-heading)]"
        >
          Matchpoint
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#333333] transition-colors hover:text-[#0B4F6C] font-[family-name:var(--font-inter)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <>
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 text-[#333333] hover:text-[#0B4F6C]"
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="bg-[#E8F4F8] text-[#0B4F6C] text-xs font-medium">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-[family-name:var(--font-inter)] text-[#333333]">
                    {userName || "My Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="cursor-pointer font-[family-name:var(--font-inter)]"
                      >
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/games"
                        className="cursor-pointer font-[family-name:var(--font-inter)]"
                      >
                        <Gamepad2 className="size-4" />
                        My Games
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer font-[family-name:var(--font-inter)]"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="text-sm text-[#333333] hover:text-[#0B4F6C] font-[family-name:var(--font-inter)]"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-[#0B4F6C] text-sm text-white hover:bg-[#0B4F6C]/90 font-[family-name:var(--font-inter)]"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn && <NotificationBell />}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#333333]"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-semibold text-[#0B4F6C] font-[family-name:var(--font-heading)]">
                  Matchpoint
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-[#333333] transition-colors hover:bg-[#E8F4F8]/50 hover:text-[#0B4F6C] font-[family-name:var(--font-inter)]"
                  >
                    {link.label}
                  </Link>
                ))}

                {isLoggedIn ? (
                  <>
                    <div className="my-2 h-px bg-[#E2E8F0]" />
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#333333] transition-colors hover:bg-[#E8F4F8]/50 hover:text-[#0B4F6C] font-[family-name:var(--font-inter)]"
                    >
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/games"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#333333] transition-colors hover:bg-[#E8F4F8]/50 hover:text-[#0B4F6C] font-[family-name:var(--font-inter)]"
                    >
                      <Gamepad2 className="size-4" />
                      My Games
                    </Link>
                    <div className="my-2 h-px bg-[#E2E8F0]" />
                    <button
                      onClick={() => {
                        signOut();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-[#333333] transition-colors hover:bg-[#E8F4F8]/50 hover:text-[#0B4F6C] font-[family-name:var(--font-inter)]"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 h-px bg-[#E2E8F0]" />
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-[#333333] transition-colors hover:bg-[#E8F4F8]/50 hover:text-[#0B4F6C] font-[family-name:var(--font-inter)]"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md bg-[#0B4F6C] px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#0B4F6C]/90 font-[family-name:var(--font-inter)]"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
