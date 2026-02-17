export default function TermsPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-[#0A0A0A] mb-3 tracking-wide">
          Terms & Conditions
        </h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: January 2025</p>

        <div className="prose prose-sm max-w-none text-[#333333] space-y-6">
          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using Matchpoint, you agree to be bound by these Terms and Conditions. If you do not agree
              with any part of these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">2. Service Description</h2>
            <p className="leading-relaxed">
              Matchpoint provides a platform for pickleball players to discover pre-booked court slots and connect with
              other players for games. We facilitate the matching and payment process but do not directly operate courts
              or facilities.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">3. Payments & Refunds</h2>
            <p className="leading-relaxed">
              Court payments are processed through Stripe and are charged only when a game is confirmed with the required
              number of players. All court payments are non-refundable once a game is confirmed. By reserving a spot,
              you authorize Matchpoint to charge your payment method upon game confirmation.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">4. User Conduct</h2>
            <p className="leading-relaxed">
              Users are expected to attend confirmed games. No-shows will result in strikes on your account. Three strikes
              may lead to account restriction. Players must accurately represent their skill level and participate
              respectfully.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">5. Limitation of Liability</h2>
            <p className="leading-relaxed">
              Matchpoint is not responsible for injuries, property damage, or other incidents that occur during games.
              Players participate at their own risk. We recommend appropriate warm-up and awareness of your physical
              condition before playing.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">6. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of Matchpoint after changes
              constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
