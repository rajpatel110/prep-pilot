import "server-only";
import { HttpError } from "@/shared/server/http";

export function catalogMutationError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  const databaseError = error as {
    code?: number;
    keyPattern?: Record<string, number>;
    name?: string;
    hasErrorLabel?: (label: string) => boolean;
  } | null;
  if (databaseError?.hasErrorLabel?.("UnknownTransactionCommitResult"))
    return new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "The save outcome is uncertain. Reconcile the saved content before retrying.",
    );
  if (
    databaseError?.code === 11000 &&
    databaseError.keyPattern?.slug === 1 &&
    Object.keys(databaseError.keyPattern).length === 1
  )
    return new HttpError(
      409,
      "SLUG_TAKEN",
      "This content slug is already in use.",
      { slug: ["Choose a different slug."] },
    );
  if (
    databaseError?.code === 112 ||
    databaseError?.code === 251 ||
    databaseError?.hasErrorLabel?.("TransientTransactionError") ||
    databaseError?.name === "DocumentNotFoundError"
  )
    return new HttpError(
      409,
      "CONTENT_CONFLICT",
      "Content changed during the save. Refetch and reconcile before retrying.",
    );
  if (
    [
      "MongoServerSelectionError",
      "MongoNetworkError",
      "MongoNetworkTimeoutError",
      "MongoOperationTimeoutError",
      "MongooseServerSelectionError",
    ].includes(databaseError?.name ?? "")
  )
    return new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "The save could not be confirmed. Reconcile the saved content before retrying.",
    );
  return new HttpError(
    500,
    "INTERNAL_ERROR",
    "The content could not be saved. Use the request ID for diagnosis.",
  );
}
