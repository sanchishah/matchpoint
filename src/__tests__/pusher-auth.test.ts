import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockFindUniqueParticipant = vi.fn();
const mockFindUniqueUser = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    gameParticipant: {
      findUnique: (...args: unknown[]) => mockFindUniqueParticipant(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUniqueUser(...args),
    },
  },
}));

const mockAuthorizeChannel = vi.fn();
vi.mock("@/lib/pusher/server", () => ({
  pusherServer: {
    authorizeChannel: (...args: unknown[]) => mockAuthorizeChannel(...args),
  },
}));

const { POST } = await import("@/app/api/realtime/auth/route");

// ── Helpers ──────────────────────────────────────────────

function makeRequest(body: string) {
  return new Request("http://localhost:3000/api/realtime/auth", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

// ── Tests ────────────────────────────────────────────────

describe("POST /api/realtime/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest("socket_id=123&channel_name=private-game-abc"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid channel format", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const res = await POST(makeRequest("socket_id=123&channel_name=invalid-channel"));
    expect(res.status).toBe(400);
  });

  it("allows participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockFindUniqueParticipant.mockResolvedValue({ id: "gp1", gameId: "game1", userId: "user1" });
    mockFindUniqueUser.mockResolvedValue({ role: "USER" });
    mockAuthorizeChannel.mockReturnValue({ auth: "token" });

    const res = await POST(makeRequest("socket_id=sock1&channel_name=private-game-game1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.auth).toBe("token");
  });

  it("denies non-participant non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user2" } });
    mockFindUniqueParticipant.mockResolvedValue(null);
    mockFindUniqueUser.mockResolvedValue({ role: "USER" });

    const res = await POST(makeRequest("socket_id=sock1&channel_name=private-game-game1"));
    expect(res.status).toBe(403);
  });

  it("allows admin non-participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin1" } });
    mockFindUniqueParticipant.mockResolvedValue(null);
    mockFindUniqueUser.mockResolvedValue({ role: "ADMIN" });
    mockAuthorizeChannel.mockReturnValue({ auth: "admin-token" });

    const res = await POST(makeRequest("socket_id=sock1&channel_name=private-game-game1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.auth).toBe("admin-token");
  });
});
