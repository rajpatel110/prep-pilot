import "server-only";
import { HttpError } from "@/shared/server/http";
import { StudyValidationError } from "./schemas";
export function studyError(error: unknown) {
  if (error instanceof HttpError) return error;
  if (error instanceof StudyValidationError)
    return new HttpError(422, "VALIDATION_ERROR", error.message, error.fields);
  const failure = error as {
    code?: number;
    hasErrorLabel?: (label: string) => boolean;
    name?: string;
  };
  if (failure?.hasErrorLabel?.("UnknownTransactionCommitResult"))
    return new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "The outcome is uncertain. Keep and retry the same submission identifier.",
    );
  if (
    [11000, 112, 251].includes(failure?.code ?? 0) ||
    failure?.hasErrorLabel?.("TransientTransactionError")
  )
    return new HttpError(
      409,
      "STATE_CONFLICT",
      "Study state changed. Retry the same submission identifier.",
    );
  if (
    [
      "MongoNetworkError",
      "MongoNetworkTimeoutError",
      "MongoServerSelectionError",
      "MongoOperationTimeoutError",
      "MongooseServerSelectionError",
    ].includes(failure?.name ?? "")
  )
    return new HttpError(
      503,
      "DEPENDENCY_UNAVAILABLE",
      "The outcome could not be confirmed. Keep the submission identifier and retry.",
    );
  return new HttpError(
    500,
    "INTERNAL_ERROR",
    "The study operation could not be confirmed. Keep its identifier and use the request ID for diagnosis.",
  );
}
export const studyTransaction = {
  readPreference: "primary" as const,
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
  timeoutMS: 15000,
  maxCommitTimeMS: 5000,
};
