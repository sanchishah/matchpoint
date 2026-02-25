import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mymatchpoint.com"),
  title: {
    default: "Matchpoint — Where Players Meet Their Match",
    template: "%s | Matchpoint",
  },
  description:
    "Book courts. Match with players. Rally with your kind of people. Elegant pickleball matching for the South Bay.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Matchpoint",
    title: "Matchpoint — Where Players Meet Their Match",
    description:
      "Book courts. Match with players. Rally with your kind of people.",
    url: "https://www.mymatchpoint.com",
  },
  twitter: {
    card: "summary",
    title: "Matchpoint — Where Players Meet Their Match",
    description:
      "Book courts. Match with players. Rally with your kind of people.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0B4F6C" />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
