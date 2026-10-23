export type DatabaseTarget = {
  uri: string;
  database: string;
  environment: "development" | "test";
};

export function databaseTarget(
  args: string[],
  env: Record<string, string | undefined>,
): DatabaseTarget {
  const allowed = new Set(["--database", "--environment"]);
  const options = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]!;
    const value = args[index + 1];
    if (
      !allowed.has(key) ||
      !value ||
      value.startsWith("--") ||
      options.has(key)
    )
      throw new Error(
        "Specify --database and --environment development|test exactly once.",
      );
    options.set(key, value);
  }
  const uri = env.MONGODB_URI;
  const database = options.get("--database");
  const environment = options.get("--environment");
  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri))
    throw new Error("MONGODB_URI is required.");
  if (!database || !/^[a-zA-Z0-9_-]{1,63}$/.test(database))
    throw new Error("An explicit valid --database is required.");
  if (environment !== "development" && environment !== "test")
    throw new Error(
      "Select --environment development or test; production is not supported.",
    );
  if (env.NODE_ENV === "production")
    throw new Error("Database tools do not run in production mode.");
  if (["admin", "local", "config"].includes(database))
    throw new Error("System databases are not supported.");
  return { uri, database, environment };
}
