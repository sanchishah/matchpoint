export const SKILL_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Beginner+" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Expert" },
] as const;

export const AGE_BRACKETS = [
  { value: "AGE_18_24", label: "18–24" },
  { value: "AGE_25_34", label: "25–34" },
  { value: "AGE_35_44", label: "35–44" },
  { value: "AGE_45_54", label: "45–54" },
  { value: "AGE_55_64", label: "55–64" },
  { value: "AGE_65_PLUS", label: "65+" },
] as const;

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  { value: "OTHER", label: "Other" },
] as const;

export const RADIUS_OPTIONS = [
  { value: 3, label: "3 miles" },
  { value: 5, label: "5 miles" },
  { value: 10, label: "10 miles" },
] as const;

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "sanchishah@gmail.com").split(",").map((e) => e.trim());

export function skillLabel(level: number): string {
  return SKILL_LEVELS.find((s) => s.value === level)?.label || `Level ${level}`;
}

export function ageBracketLabel(bracket: string): string {
  return AGE_BRACKETS.find((a) => a.value === bracket)?.label || bracket;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Simple haversine distance in miles
export function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
