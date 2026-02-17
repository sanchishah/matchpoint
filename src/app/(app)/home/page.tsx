import Link from "next/link";
import Image from "next/image";
import { Target, MapPin, MessageCircle, CreditCard, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Target,
    title: "Skill-Based Matchmaking",
    desc: "Connect with players near you based on level, age, and play style.",
    image: "https://images.unsplash.com/photo-1747027694225-cbf12dd20826?w=600&h=400&fit=crop",
  },
  {
    icon: MapPin,
    title: "Court Booking Made Easy",
    desc: "Find and reserve courts nearby in just a few taps.",
    image: "https://images.unsplash.com/photo-1693142518820-78d7a05f1546?w=600&h=400&fit=crop",
  },
  {
    icon: MessageCircle,
    title: "Game Coordination",
    desc: "Built-in group chats open before every match.",
    image: "https://images.unsplash.com/photo-1643581278970-413ac3900826?w=600&h=400&fit=crop",
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    desc: "Only pay your share for the court. Apple Pay, PayPal, or card.",
    image: "https://images.unsplash.com/photo-1768879045902-6412996b9d51?w=600&h=400&fit=crop",
  },
  {
    icon: Star,
    title: "Player Ratings",
    desc: "Rate games and confirm player skill levels after each match.",
    image: "https://images.unsplash.com/photo-1747027694256-575ee28c793e?w=600&h=400&fit=crop",
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
      <section className="relative bg-[#0F1923] py-24 md:py-32 overflow-hidden">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1643581278970-413ac3900826?w=1920&h=1080&fit=crop"
          alt=""
          fill
          className="object-cover opacity-20"
          priority
        />
        {/* Gradient orbs for depth */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#0B4F6C]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#C8F542]/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <span className="inline-block mb-6 px-4 py-1.5 rounded-lg bg-[#C8F542]/10 text-[#C8F542] text-sm font-semibold tracking-wide font-[family-name:var(--font-heading)]">
            Now in the South Bay
          </span>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl tracking-tight text-white mb-6 uppercase font-extrabold">
            Where players meet their match.
          </h1>
          <p className="font-[family-name:var(--font-inter)] text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Book courts. Match with players. Rally with your kind of people.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button className="bg-[#C8F542] hover:bg-[#B8E532] text-[#0F1923] rounded-lg px-8 py-3 h-12 text-base font-bold">
                Get Started
              </Button>
            </Link>
            <Link href="#available-slots">
              <Button
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-lg px-8 py-3 h-12 text-base"
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
          <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-center text-[#0A0A0A] mb-16 tracking-tight">
            What Matchpoint Does for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-white rounded-xl overflow-hidden border border-[#E2E8F0] transition-transform hover:-translate-y-1"
              >
                {/* Feature image */}
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={f.image}
                    alt={f.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Lime accent bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#C8F542] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 z-10" />

                <div className="p-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${i % 2 === 0 ? 'bg-[#0B4F6C]/10' : 'bg-[#C8F542]/15'}`}>
                    <f.icon className="w-6 h-6 text-[#0B4F6C]" strokeWidth={2} />
                  </div>
                  <h3 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">
                    {f.title}
                  </h3>
                  <p className="font-[family-name:var(--font-inter)] text-[#333333] text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle banner */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1693142519538-87affcfa2663?w=1920&h=600&fit=crop"
          alt="Pickleball players in action"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0F1923]/60" />
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <p className="font-[family-name:var(--font-heading)] text-2xl md:text-4xl text-white max-w-3xl tracking-tight">
            Find your people. Own the court.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#F1F5F9]">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-center text-[#0A0A0A] mb-16 tracking-tight">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="bg-white rounded-xl p-8 border border-[#E2E8F0]">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#0B4F6C] text-white text-sm font-bold font-[family-name:var(--font-heading)]">
                  {s.num}
                </span>
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0A0A0A] mt-4 mb-3">
                  {s.title}
                </h3>
                <p className="font-[family-name:var(--font-inter)] text-[#333333] text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Slots CTA */}
      <section id="available-slots" className="relative py-20 md:py-28 bg-white overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-[#0A0A0A] mb-6 tracking-tight">
            Reserve Your Court & Rally!
          </h2>
          <p className="font-[family-name:var(--font-inter)] text-[#333333] max-w-xl mx-auto mb-10 leading-relaxed">
            Browse available courts in the South Bay. You&apos;re only charged when a game is confirmed.
          </p>
          <Link href="/book">
            <Button className="bg-[#0B4F6C] hover:bg-[#083D54] text-white rounded-lg px-10 py-3 h-12 text-base">
              Browse All Courts
            </Button>
          </Link>
          <p className="text-xs text-[#64748B] mt-6 max-w-md mx-auto">
            Slots are only confirmed when all required players are found (2 for singles, 4 for doubles).
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative py-16 bg-[#0F1923] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1567684935919-81c216847116?w=1920&h=600&fit=crop"
          alt=""
          fill
          className="object-cover opacity-15"
        />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="font-[family-name:var(--font-heading)] text-2xl text-white mb-6">
            Questions? We&apos;d love to hear from you.
          </p>
          <Link href="/contact">
            <Button className="bg-[#C8F542] hover:bg-[#B8E532] text-[#0F1923] rounded-lg px-8 py-3 h-12 text-base font-bold">
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
