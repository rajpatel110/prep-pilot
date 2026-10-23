// Safe for either server or browser imports. No process.env or secrets here.
export const appConfig = {
  name: "PrepPilot",
  description: "A clearer path to placement preparation.",
  studyTimezone: "Asia/Kolkata",
} as const;
