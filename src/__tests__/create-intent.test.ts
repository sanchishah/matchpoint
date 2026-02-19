import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockGameFindUnique = vi.fn();
const mockPaymentFindUnique = vi.fn();
const mockPaymentUpsert = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    game: {
      findUnique: (...args: unknown[]) => mockGameFindUnique(...args),
    },
    payment: {
      findUnique: (...args: unknown[]) => mockPaymentFindUnique(...args),
      upsert: (...args: unknown[]) => mockPaymentUpsert(...args),
    },
  },
}));

const mockPICreate = vi.fn();
const mockPIRetrieve = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: {
    paymentIntents: {
      create: (...args: unknown[]) => mockPICreate(...args),
      retrieve: (...args: unknown[]) => mockPIRetrieve(...args),
    },
  },
}));

const { POST } = await import("@/app/api/games/[id]/payments/create-intent/route");

// ── Helpers ──────────────────────────────────────────────

const fakeGame = {
  id: "game1",
  slot: { totalCostCents: 1000, requiredPlayers: 4 },
  participants: [{ userId: "user1" }, { userId: "user2" }, { userId: "user3" }, { userId: "user4" }],
};

function makeRequest() {
  return new Request("http://localhost:3000/api/games/game1/payments/create-intent", {
    method: "POST",
  });
}

const makeParams = () => Promise.resolve({ id: "game1" });

// ── Tests ────────────────────────────────────────────────

describe("POST /api/games/[id]/payments/create-intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    mockGameFindUnique.mockResolvedValue(fakeGame);
  });

  it("returns clientSecret for new payment", async () => {
    mockPaymentFindUnique.mockResolvedValue(null);
    mockPICreate.mockResolvedValue({
      id: "pi_new",
      client_secret: "pi_new_secret_123",
    });
    mockPaymentUpsert.mockResolvedValue({
      id: "pay_1",
      stripePaymentIntentId: "pi_new",
    });

    const res = await POST(makeRequest(), { params: makeParams() });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.clientSecret).toBe("pi_new_secret_123");
    expect(data.amountCents).toBe(250); // 1000 / 4
    expect(data.currency).toBe("usd");
  });

  it("returns existing PI for pending payment (idempotent)", async () => {
    mockPaymentFindUnique.mockResolvedValue({
      id: "pay_existing",
      status: "PENDING",
      stripePaymentIntentId: "pi_existing",
    });
    mockPIRetrieve.mockResolvedValue({
      id: "pi_existing",
      client_secret: "pi_existing_secret",
    });

    const res = await POST(makeRequest(), { params: makeParams() });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.clientSecret).toBe("pi_existing_secret");
    expect(data.paymentId).toBe("pay_existing");
    // Should NOT create a new PI
    expect(mockPICreate).not.toHaveBeenCalled();
  });

  it("returns error when already paid", async () => {
    mockPaymentFindUnique.mockResolvedValue({
      id: "pay_done",
      status: "SUCCEEDED",
    });

    const res = await POST(makeRequest(), { params: makeParams() });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Already paid");
  });

  it("denies non-participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "stranger" } });

    const res = await POST(makeRequest(), { params: makeParams() });
    expect(res.status).toBe(403);
  });

  it("returns 401 if unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(), { params: makeParams() });
    expect(res.status).toBe(401);
  });

  it("passes idempotencyKey to stripe", async () => {
    mockPaymentFindUnique.mockResolvedValue(null);
    mockPICreate.mockResolvedValue({
      id: "pi_idem",
      client_secret: "secret",
    });
    mockPaymentUpsert.mockResolvedValue({ id: "pay_idem" });

    await POST(makeRequest(), { params: makeParams() });

    expect(mockPICreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250, currency: "usd" }),
      { idempotencyKey: "game:game1:user:user1" }
    );
  });
});
