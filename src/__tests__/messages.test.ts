import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGameFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockMessageFindMany = vi.fn();
const mockMessageCreate = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    game: {
      findUnique: (...args: unknown[]) => mockGameFindUnique(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    message: {
      findMany: (...args: unknown[]) => mockMessageFindMany(...args),
      create: (...args: unknown[]) => mockMessageCreate(...args),
    },
  },
}));

vi.mock("@/lib/pusher/server", () => ({
  pusherServer: {
    trigger: vi.fn().mockResolvedValue(undefined),
  },
}));

const { GET } = await import("@/app/api/games/[id]/messages/route");

// ── Helpers ──────────────────────────────────────────────

const fakeGame = {
  id: "game1",
  startTime: new Date("2026-03-01T10:00:00Z"),
  endTime: new Date("2026-03-01T11:00:00Z"),
  status: "CONFIRMED",
  slot: { club: { id: "club1" } },
  participants: [{ userId: "user1" }, { userId: "user2" }],
};

function makeGetRequest(queryParams = "") {
  return new Request(`http://localhost:3000/api/games/game1/messages${queryParams}`);
}

const makeParams = () => Promise.resolve({ id: "game1" });

// ── Tests ────────────────────────────────────────────────

describe("GET /api/games/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockUserFindUnique.mockResolvedValue({ role: "USER" });
    mockGameFindUnique.mockResolvedValue(fakeGame);
  });

  it("returns newest-first messages", async () => {
    const messages = [
      { id: "msg3", createdAt: new Date("2026-03-01T10:03:00Z"), body: "third" },
      { id: "msg2", createdAt: new Date("2026-03-01T10:02:00Z"), body: "second" },
      { id: "msg1", createdAt: new Date("2026-03-01T10:01:00Z"), body: "first" },
    ];
    mockMessageFindMany.mockResolvedValue(messages);

    const res = await GET(makeGetRequest("?limit=10"), { params: makeParams() });
    const data = await res.json();

    expect(data.items).toHaveLength(3);
    expect(data.items[0].id).toBe("msg3");
    expect(data.items[2].id).toBe("msg1");
  });

  it("returns nextCursor when results equal limit", async () => {
    const messages = [
      { id: "msg2", createdAt: new Date("2026-03-01T10:02:00Z"), body: "b" },
      { id: "msg1", createdAt: new Date("2026-03-01T10:01:00Z"), body: "a" },
    ];
    mockMessageFindMany.mockResolvedValue(messages);

    const res = await GET(makeGetRequest("?limit=2"), { params: makeParams() });
    const data = await res.json();

    expect(data.nextCursor).toBe("msg1");
  });

  it("returns null nextCursor when results less than limit", async () => {
    mockMessageFindMany.mockResolvedValue([
      { id: "msg1", body: "only one" },
    ]);

    const res = await GET(makeGetRequest("?limit=10"), { params: makeParams() });
    const data = await res.json();

    expect(data.nextCursor).toBeNull();
  });

  it("denies non-participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "stranger" } });
    mockUserFindUnique.mockResolvedValue({ role: "USER" });

    const res = await GET(makeGetRequest(), { params: makeParams() });
    expect(res.status).toBe(403);
  });

  it("respects cursor parameter", async () => {
    mockMessageFindMany.mockResolvedValue([]);

    await GET(makeGetRequest("?cursor=msg5&limit=10"), { params: makeParams() });

    expect(mockMessageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "msg5" },
        skip: 1,
      })
    );
  });
});
