import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// ── Mocks ──────────────────────────────────────────────

const mockWebhookCreate = vi.fn();
const mockPaymentUpdateMany = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    stripeWebhookEvent: {
      create: (...args: unknown[]) => mockWebhookCreate(...args),
    },
    payment: {
      updateMany: (...args: unknown[]) => mockPaymentUpdateMany(...args),
    },
  },
}));

const mockConstructEvent = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));

const { POST } = await import("@/app/api/webhooks/stripe/route");

// ── Helpers ──────────────────────────────────────────────

function makeRequest(body: string, sig = "valid-sig") {
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: { "stripe-signature": sig },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fakeEvent(type: string, data: Record<string, unknown>): any {
  return { id: `evt_${type}_123`, type, data: { object: data } };
}

// ── Tests ────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(makeRequest("body", "bad-sig"));
    expect(res.status).toBe(400);
  });

  it("processes payment_intent.succeeded and updates payment", async () => {
    const event = fakeEvent("payment_intent.succeeded", { id: "pi_123" });
    mockConstructEvent.mockReturnValue(event);
    mockWebhookCreate.mockResolvedValue({ id: "whe_1" });
    mockPaymentUpdateMany.mockResolvedValue({ count: 1 });

    const res = await POST(makeRequest("body"));
    expect(res.status).toBe(200);

    expect(mockPaymentUpdateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_123" },
      data: { status: "SUCCEEDED" },
    });
  });

  it("handles idempotency — same eventId processed only once", async () => {
    const event = fakeEvent("payment_intent.succeeded", { id: "pi_456" });
    mockConstructEvent.mockReturnValue(event);

    // First call succeeds
    mockWebhookCreate.mockResolvedValueOnce({ id: "whe_1" });
    mockPaymentUpdateMany.mockResolvedValue({ count: 1 });
    await POST(makeRequest("body"));
    expect(mockPaymentUpdateMany).toHaveBeenCalledTimes(1);

    // Second call: unique violation
    mockWebhookCreate.mockRejectedValueOnce({ code: "P2002" });
    const res2 = await POST(makeRequest("body"));
    expect(res2.status).toBe(200);
    const data = await res2.json();
    expect(data.duplicate).toBe(true);
    // Payment should not be updated again
    expect(mockPaymentUpdateMany).toHaveBeenCalledTimes(1);
  });

  it("processes payment_intent.payment_failed", async () => {
    const event = fakeEvent("payment_intent.payment_failed", { id: "pi_fail" });
    mockConstructEvent.mockReturnValue(event);
    mockWebhookCreate.mockResolvedValue({ id: "whe_2" });
    mockPaymentUpdateMany.mockResolvedValue({ count: 1 });

    await POST(makeRequest("body"));
    expect(mockPaymentUpdateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_fail" },
      data: { status: "FAILED" },
    });
  });

  it("processes charge.refunded", async () => {
    const event = fakeEvent("charge.refunded", {
      id: "ch_123",
      payment_intent: "pi_refund",
    });
    mockConstructEvent.mockReturnValue(event);
    mockWebhookCreate.mockResolvedValue({ id: "whe_3" });
    mockPaymentUpdateMany.mockResolvedValue({ count: 1 });

    await POST(makeRequest("body"));
    expect(mockPaymentUpdateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_refund" },
      data: { status: "REFUNDED" },
    });
  });

  it("returns 400 if no stripe-signature header", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: "body",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
