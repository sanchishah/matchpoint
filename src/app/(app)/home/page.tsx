import Link from "next/link";
import { Target, MapPin, MessageCircle, CreditCard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Target,
    title: "Skill-Based Matchmaking",
    desc: "Connect with players near you based on level, age, and play style.",
    bg: "bg-[#DDEFE6]",
  },
  {
    icon: MapPin,
    title: "Court Booking Made Easy",
    desc: "Find and reserve courts nearby in just a few taps.",
    bg: "bg-[#E6F0F6]",
  },
  {
    icon: MessageCircle,
    title: "Game Coordination",
    desc: "Built-in group chats open before every match.",
    bg: "bg-[#DDEFE6]",
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    desc: "Only pay your share for the court. Apple Pay, PayPal, or card.",
    bg: "bg-[#E6F0F6]",
  },
  {
    icon: Star,
    title: "Player Ratings",
    desc: "Rate games and confirm player skill levels after each match.",
    bg: "bg-[#DDEFE6]",
  },
];

const steps = [
  {
    num: "01",
    title: "Create Your Profile",
    desc: "Add your name, age, gender, and skill level (1–5). Choose your play radius.",
  },
  {
    num: "02",
    title: "Find & Book a Court",
    desc: "Enter your location to find available courts. Filter by date, time, and mark favorites.",
  },
  {
    num: "03",
    title: "Get Matched with Players",
    desc: "We match you based on skill and age bracket. You're only charged if enough players are matched.",
  },
  {
    num: "04",
    title: "Play & Rate",
    desc: "Group chat opens 15 mins before game. After the match, rate the game and confirm player skills.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#DDEFE6] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl tracking-wide text-[#2A2A2A] mb-6">
            Where players meet their match.
          </h1>
          <p className="font-[family-name:var(--font-inter)] text-lg md:text-xl text-[#4A4A4A] max-w-2xl mx-auto mb-10">
            Book courts. Match with players. Rally with your kind of people.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button className="bg-[#3F6F5E] hover:bg-[#345C4E] text-white rounded-full px-8 py-3 h-12 text-base">
                Get Started
              </Button>
            </Link>
            <Link href="#available-slots">
              <Button
                variant="outline"
                className="border-[#3F6F5E] text-[#3F6F5E] hover:bg-[#3F6F5E] hover:text-white rounded-full px-8 py-3 h-12 text-base"
              >
                Book a Court
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-center text-[#2A2A2A] mb-16 tracking-wide">
            What Matchpoint Does for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className={`${f.bg} rounded-2xl p-8 transition-transform hover:-translate-y-1`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-[#3F6F5E]" strokeWidth={1.5} />
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl text-[#2A2A2A] mb-3">
                  {f.title}
                </h3>
                <p className="font-[family-name:var(--font-inter)] text-[#4A4A4A] text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#E6F0F6]">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-center text-[#2A2A2A] mb-16 tracking-wide">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-8 border border-[#F1F1F1]">
                <span className="font-[family-name:var(--font-playfair)] text-3xl text-[#3F6F5E] opacity-60">
                  {s.num}
                </span>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg text-[#2A2A2A] mt-4 mb-3">
                  {s.title}
                </h3>
                <p className="font-[family-name:var(--font-inter)] text-[#4A4A4A] text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Slots CTA */}
      <section id="available-slots" className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#2A2A2A] mb-6 tracking-wide">
            Reserve Your Court & Rally!
          </h2>
          <p className="font-[family-name:var(--font-inter)] text-[#4A4A4A] max-w-xl mx-auto mb-10 leading-relaxed">
            Browse available courts in the South Bay. You&apos;re only charged when a game is confirmed.
          </p>
          <Link href="/book">
            <Button className="bg-[#3F6F5E] hover:bg-[#345C4E] text-white rounded-full px-10 py-3 h-12 text-base">
              Browse All Courts
            </Button>
          </Link>
          <p className="text-xs text-[#717171] mt-6 max-w-md mx-auto">
            Slots are only confirmed when all required players are found (2 for singles, 4 for doubles).
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-[#DDEFE6]">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="font-[family-name:var(--font-playfair)] text-2xl text-[#2A2A2A] mb-6">
            Questions? We&apos;d love to hear from you.
          </p>
          <Link href="/contact">
            <Button
              variant="outline"
              className="border-[#3F6F5E] text-[#3F6F5E] hover:bg-[#3F6F5E] hover:text-white rounded-full px-8 py-3 h-12 text-base"
            >
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
