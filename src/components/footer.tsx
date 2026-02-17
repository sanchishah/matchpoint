import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

const socialLinks = [
  { href: "#", label: "Instagram", icon: Instagram },
  { href: "#", label: "X (Twitter)", icon: Twitter },
  { href: "#", label: "Facebook", icon: Facebook },
];

export default function Footer() {
  return (
    <footer className="w-full">
      {/* Main footer */}
      <div className="bg-[#0F1923]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8">
            {/* Brand */}
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-white font-[family-name:var(--font-heading)]"
            >
              Matchpoint
            </Link>

            {/* Navigation */}
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#B0BEC5] transition-colors hover:text-[#C8F542] font-[family-name:var(--font-inter)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Social icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[#B0BEC5] transition-colors hover:bg-[#C8F542] hover:border-[#C8F542] hover:text-[#0F1923]"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px w-full max-w-md bg-white/10" />

            {/* Copyright */}
            <p className="text-center text-xs text-[#B0BEC5]/70 font-[family-name:var(--font-inter)]">
              Matchpoint &copy; 2025 &mdash; All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
