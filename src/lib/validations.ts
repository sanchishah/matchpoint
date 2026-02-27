import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(18, "Must be at least 18").max(100),
  ageBracket: z.enum(["AGE_18_24", "AGE_25_34", "AGE_35_44", "AGE_45_54", "AGE_55_64", "AGE_65_PLUS"]),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", "OTHER"]),
  skillLevel: z.number().int().min(1).max(5),
  radiusMiles: z.number().int().refine((v) => [3, 5, 10].includes(v), "Must be 3, 5, or 10"),
  zip: z.string().min(5, "Enter a valid zip code").max(10),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const slotSchema = z.object({
  clubId: z.string().min(1),
  startTime: z.string().min(1, "Start time is required"),
  durationMins: z.number().int().refine((v) => [60, 120].includes(v)),
  format: z.enum(["SINGLES", "DOUBLES"]),
  totalCostCents: z.number().int().min(0),
  skillLevel: z.number().int().min(1).max(5),
  ageBracket: z.enum(["AGE_18_24", "AGE_25_34", "AGE_35_44", "AGE_45_54", "AGE_55_64", "AGE_65_PLUS"]),
  notes: z.string().optional(),
});

export const clubSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().default("CA"),
  zip: z.string().min(5),
  lat: z.number(),
  lng: z.number(),
  notes: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(1, "Message is required").max(2000),
});

export const ratingSchema = z.object({
  rateeId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  feltLevel: z.enum(["BELOW", "AT", "ABOVE"]),
  comment: z.string().max(500).optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(500),
});

export const emailPreferenceSchema = z.object({
  gameConfirmations: z.boolean().optional(),
  reminders: z.boolean().optional(),
  chatNotifications: z.boolean().optional(),
  marketing: z.boolean().optional(),
  referralUpdates: z.boolean().optional(),
  friendRequests: z.boolean().optional(),
  availabilityMatches: z.boolean().optional(),
});

export const availabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(23),
}).refine((data) => data.endHour > data.startHour, {
  message: "End hour must be after start hour",
});

export const friendRequestSchema = z.object({
  addresseeId: z.string().min(1, "Addressee ID is required"),
});

export const friendResponseSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

export const gameScoreSchema = z.object({
  team1Score: z.number().int().min(0).max(99),
  team2Score: z.number().int().min(0).max(99),
});
