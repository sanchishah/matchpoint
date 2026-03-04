"use client";

/**
 * Dot bounce loader — three dots in brand blue bouncing in sequence.
 * Optionally accepts a contextual message (e.g. "Finding courts").
 */
export function DotLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#0B4F6C] animate-[dotBounce_1.2s_ease-in-out_infinite]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#0B4F6C] animate-[dotBounce_1.2s_ease-in-out_0.2s_infinite]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#0B4F6C] animate-[dotBounce_1.2s_ease-in-out_0.4s_infinite]" />
      </div>
      {message && (
        <p className="text-sm text-[#64748B]">{message}</p>
      )}
    </div>
  );
}

/**
 * Inline variant for use inside cards or sections (no min-height).
 */
export function DotLoaderInline({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#0B4F6C] animate-[dotBounce_1.2s_ease-in-out_infinite]" />
        <span className="w-2 h-2 rounded-full bg-[#0B4F6C] animate-[dotBounce_1.2s_ease-in-out_0.2s_infinite]" />
        <span className="w-2 h-2 rounded-full bg-[#0B4F6C] animate-[dotBounce_1.2s_ease-in-out_0.4s_infinite]" />
      </div>
      {message && (
        <p className="text-sm text-[#64748B]">{message}</p>
      )}
    </div>
  );
}
