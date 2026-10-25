import type { IndexDescription } from "mongodb";
export const administrationIndexes: Record<string, IndexDescription[]> = {
  profiles: [
    {
      key: { role: 1 },
      name: "profiles_one_owner",
      unique: true,
      partialFilterExpression: { role: "owner" },
    },
    { key: { role: 1, _id: 1 }, name: "profiles_admin_roles" },
  ],
  adminReauth: [
    {
      key: { expiresAt: 1 },
      name: "adminReauth_expiry",
      expireAfterSeconds: 0,
    },
  ],
  adminRoleOperations: [
    {
      key: { actorUserId: 1, operationId: 1 },
      name: "adminRoleOperations_identity",
      unique: true,
    },
  ],
};
