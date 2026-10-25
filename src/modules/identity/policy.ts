export type AccessProfile = {
  role: "student" | "admin" | "owner";
  lifecycle: "active" | "deleting";
  preferences: unknown | null;
};

export function destination(
  profile: AccessProfile,
  verified: boolean,
  emailMode: "test" | "live",
) {
  if (profile.lifecycle !== "active") return "/login";
  if (emailMode === "live" && !verified) return "/verify-email";
  if (profile.role === "admin" || profile.role === "owner") return "/admin";
  return profile.preferences === null ? "/onboarding" : "/dashboard";
}
