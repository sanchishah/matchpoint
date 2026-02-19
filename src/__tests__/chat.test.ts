import { describe, it, expect } from "vitest";
import { canWriteChat } from "@/lib/chat";

function makeGame(overrides: Partial<{ startTime: Date; endTime: Date; status: string }> = {}) {
  const start = overrides.startTime ?? new Date("2026-03-01T10:00:00Z");
  const end = overrides.endTime ?? new Date("2026-03-01T11:00:00Z");
  return {
    startTime: start,
    endTime: end,
    status: overrides.status ?? "CONFIRMED",
  };
}

describe("canWriteChat", () => {
  it("denies when 31 minutes before start (too early)", () => {
    const game = makeGame();
    const now = new Date("2026-03-01T09:29:00Z"); // 31 min before 10:00
    const result = canWriteChat(game, now);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("30 minutes before");
  });

  it("allows when 29 minutes before start", () => {
    const game = makeGame();
    const now = new Date("2026-03-01T09:31:00Z"); // 29 min before 10:00
    const result = canWriteChat(game, now);
    expect(result.ok).toBe(true);
  });

  it("allows during game", () => {
    const game = makeGame();
    const now = new Date("2026-03-01T10:30:00Z");
    const result = canWriteChat(game, now);
    expect(result.ok).toBe(true);
  });

  it("allows 1 hour after end", () => {
    const game = makeGame();
    const now = new Date("2026-03-01T12:00:00Z"); // 1h after 11:00 end
    const result = canWriteChat(game, now);
    expect(result.ok).toBe(true);
  });

  it("denies 2h01m after end", () => {
    const game = makeGame();
    const now = new Date("2026-03-01T13:01:00Z"); // 2h01m after 11:00 end
    const result = canWriteChat(game, now);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("closed");
  });

  it("denies COMPLETED games", () => {
    const game = makeGame({ status: "COMPLETED" });
    const now = new Date("2026-03-01T10:30:00Z");
    const result = canWriteChat(game, now);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("COMPLETED");
  });

  it("denies CANCELLED games", () => {
    const game = makeGame({ status: "CANCELLED" });
    const now = new Date("2026-03-01T10:30:00Z");
    const result = canWriteChat(game, now);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("CANCELLED");
  });

  it("returns openAt and closeAt times", () => {
    const game = makeGame();
    const result = canWriteChat(game);
    // openAt = startTime - 30 min
    expect(result.openAt.getTime()).toBe(game.startTime.getTime() - 30 * 60 * 1000);
    // closeAt = endTime + 2h
    expect(result.closeAt.getTime()).toBe(game.endTime.getTime() + 2 * 60 * 60 * 1000);
  });
});
