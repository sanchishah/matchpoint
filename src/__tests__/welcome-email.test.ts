import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  welcomeEmailHtml,
  welcomeEmailText,
  DEFAULT_WELCOME_SUBJECT,
  WELCOME_SUBJECTS,
} from "@/lib/emails/welcome";

// ── Mock Prisma ──────────────────────────────────────────

const mockUpdateMany = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

// ── Mock sendEmail ───────────────────────────────────────

const mockSendEmail = vi.fn();

vi.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

// Import after mocks are set up
const { sendWelcomeEmail } = await import("@/lib/welcome-email");

// ── Helpers ──────────────────────────────────────────────

const templateVars = {
  firstName: "Sanchi",
  profileUrl: "https://matchpoint.app/profile/setup",
  unsubscribeUrl: "https://matchpoint.app/profile/setup",
};

// ─────────────────────────────────────────────────────────
// 1. Template rendering tests
// ─────────────────────────────────────────────────────────

describe("Welcome email templates", () => {
  describe("HTML template", () => {
    const html = welcomeEmailHtml(templateVars);

    it("contains the user's first name", () => {
      expect(html).toContain("Hi Sanchi,");
    });

    it("contains the CTA profile link", () => {
      expect(html).toContain('href="https://matchpoint.app/profile/setup"');
    });

    it("contains CTA button text", () => {
      expect(html).toContain("Complete Your Profile");
    });

    it("contains key email copy lines", () => {
      expect(html).toContain("You did it. You created a MatchPoint account.");
      expect(html).toContain("Skill level");
      expect(html).toContain("Age bracket");
      expect(html).toContain("Location");
      expect(html).toContain("third-shot drop");
      expect(html).toContain("start dinking");
      expect(html).toContain("great games are built before the first serve");
      expect(html).toContain("The MatchPoint Team");
      expect(html).toContain("longer rallies and new group chats");
    });

    it("contains the unsubscribe link", () => {
      expect(html).toContain("Manage notification preferences");
      expect(html).toContain("https://matchpoint.app/profile/setup");
    });

    it("contains support email", () => {
      expect(html).toContain("support@matchpoint.app");
    });

    it("contains company address placeholder", () => {
      expect(html).toContain("South Bay, CA");
    });
  });

  describe("Plain-text template", () => {
    const text = welcomeEmailText(templateVars);

    it("contains the user's first name", () => {
      expect(text).toContain("Hi Sanchi,");
    });

    it("contains the profile URL on its own", () => {
      expect(text).toContain("https://matchpoint.app/profile/setup");
    });

    it("contains key email copy lines", () => {
      expect(text).toContain("You did it. You created a MatchPoint account.");
      expect(text).toContain("Skill level");
      expect(text).toContain("Age bracket");
      expect(text).toContain("Location");
      expect(text).toContain("third-shot drop");
      expect(text).toContain("start dinking");
      expect(text).toContain("great games are built before the first serve");
      expect(text).toContain("The MatchPoint Team");
      expect(text).toContain("longer rallies and new group chats");
    });

    it("contains unsubscribe/manage link", () => {
      expect(text).toContain("Manage notifications");
    });
  });

  describe("Subject lines", () => {
    it("has the correct default subject", () => {
      expect(DEFAULT_WELCOME_SUBJECT).toBe(
        "You've officially entered the kitchen \u{1F3BE}"
      );
    });

    it("has 3 subject line options", () => {
      expect(WELCOME_SUBJECTS).toHaveLength(3);
    });
  });
});

// ─────────────────────────────────────────────────────────
// 2. Idempotency tests
// ─────────────────────────────────────────────────────────

describe("sendWelcomeEmail – idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the email when welcomeEmailSentAt is null (first call)", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindUnique.mockResolvedValue({
      email: "test@example.com",
      name: "Test User",
    });
    mockSendEmail.mockResolvedValue(undefined);

    await sendWelcomeEmail("user-123");

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-123", welcomeEmailSentAt: null },
      data: { welcomeEmailSentAt: expect.any(Date) },
    });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("does NOT send the email if welcomeEmailSentAt is already set (duplicate call)", async () => {
    // updateMany returns count: 0 => another process already claimed it
    mockUpdateMany.mockResolvedValue({ count: 0 });

    await sendWelcomeEmail("user-123");

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("calling twice only sends once", async () => {
    // First call succeeds
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });
    mockFindUnique.mockResolvedValueOnce({
      email: "test@example.com",
      name: "Test User",
    });
    mockSendEmail.mockResolvedValue(undefined);

    // Second call: updateMany returns 0
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });

    await sendWelcomeEmail("user-123");
    await sendWelcomeEmail("user-123");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────
// 3. Provider mock tests
// ─────────────────────────────────────────────────────────

describe("sendWelcomeEmail – EmailService integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendEmail with correct to, subject, html, and text", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindUnique.mockResolvedValue({
      email: "sanchi@example.com",
      name: "Sanchi Shah",
    });
    mockSendEmail.mockResolvedValue(undefined);

    await sendWelcomeEmail("user-456");

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0][0];

    expect(call.to).toBe("sanchi@example.com");
    expect(call.subject).toBe(DEFAULT_WELCOME_SUBJECT);
    expect(call.html).toContain("Hi Sanchi,");
    expect(call.html).toContain("Complete Your Profile");
    expect(call.text).toContain("Hi Sanchi,");
    expect(call.text).toBeDefined();
  });

  it("uses first name only (not full name)", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindUnique.mockResolvedValue({
      email: "jane@example.com",
      name: "Jane Doe-Smith",
    });
    mockSendEmail.mockResolvedValue(undefined);

    await sendWelcomeEmail("user-789");

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain("Hi Jane,");
    expect(call.html).not.toContain("Hi Jane Doe-Smith,");
  });

  it("falls back to 'there' if user has no name", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindUnique.mockResolvedValue({
      email: "noname@example.com",
      name: null,
    });
    mockSendEmail.mockResolvedValue(undefined);

    await sendWelcomeEmail("user-000");

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain("Hi there,");
  });

  it("does not throw if sendEmail fails (non-blocking)", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindUnique.mockResolvedValue({
      email: "fail@example.com",
      name: "Fail User",
    });
    mockSendEmail.mockRejectedValue(new Error("Resend API down"));

    // Should not throw
    await expect(sendWelcomeEmail("user-fail")).resolves.toBeUndefined();
  });
});
