export const hostedDatabase = "prep_pilot_dev";
export const localDatabase = "prep_pilot_local";

export function requireDatabaseBoundary(
  database: string,
  environment: Record<string, string | undefined>,
) {
  if (
    environment.VERCEL_ENV === "preview" &&
    [hostedDatabase, localDatabase].includes(database)
  )
    throw new Error(
      "Preview requires its own database; hosted and local targets are refused.",
    );
}
