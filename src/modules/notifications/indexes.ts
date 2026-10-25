import type { IndexDescription } from "mongodb";
export const emailIndexes: Record<string, IndexDescription[]> = {
  verificationClaims: [
    {
      key: { tokenDigest: 1 },
      unique: true,
      name: "verificationClaims_digest_unique",
    },
    {
      key: { purgeAt: 1 },
      expireAfterSeconds: 0,
      name: "verificationClaims_purge",
    },
  ],
  emailDeliveries: [
    {
      key: { operationKey: 1 },
      unique: true,
      name: "emailDeliveries_operation_unique",
    },
    {
      key: { state: 1, updatedAt: 1, _id: 1 },
      name: "emailDeliveries_state_updated_id",
    },
    {
      key: { purgeAt: 1 },
      expireAfterSeconds: 0,
      name: "emailDeliveries_purge",
    },
  ],
};
