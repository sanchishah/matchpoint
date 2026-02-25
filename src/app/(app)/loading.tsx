export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#0B4F6C]" />
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#64748B]">Loading...</p>
      </div>
    </div>
  );
}
