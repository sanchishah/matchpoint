import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/" className="text-center">
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-[#0B4F6C]">
              Matchpoint
            </h1>
            <p className="mt-1 font-[family-name:var(--font-inter)] text-xs tracking-widest text-[#333333]/60 uppercase">
              Where Players Meet Their Match
            </p>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
