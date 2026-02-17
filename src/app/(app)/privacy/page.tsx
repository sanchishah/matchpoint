export default function PrivacyPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-[#0A0A0A] mb-3 tracking-wide">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: January 2025</p>

        <div className="prose prose-sm max-w-none text-[#333333] space-y-6">
          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide when creating your account and profile, including your name, email
              address, age, gender, skill level, and location (zip code). We also collect game activity, ratings, and
              payment information processed securely through Stripe.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              Your information is used to match you with compatible players based on skill level and age bracket,
              facilitate court bookings, process payments, and communicate important game updates. Your profile is
              only visible to other participants within games you join.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">3. Data Sharing</h2>
            <p className="leading-relaxed">
              We do not sell your personal information. Limited data is shared with Stripe for payment processing
              and with Resend for transactional email delivery. Your profile information is visible only to
              participants in games you join and to Matchpoint administrators.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">4. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data.
              Passwords are hashed and payment information is handled entirely by Stripe — we never store your
              card details.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">5. Your Rights</h2>
            <p className="leading-relaxed">
              You may request access to, correction of, or deletion of your personal data at any time by contacting
              us through the Contact page. California residents have additional rights under the CCPA.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0A0A0A] mb-3">6. Contact</h2>
            <p className="leading-relaxed">
              For privacy-related inquiries, please reach out through our Contact page or email us at
              privacy@matchpoint.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
