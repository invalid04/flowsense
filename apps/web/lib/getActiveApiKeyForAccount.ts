import { and, desc, eq, isNull } from "drizzle-orm";
import { apiKeys, db } from "@repo/db";

export async function getActiveApiKeyForAccount(accountId: string) {
  const key = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.accountId, accountId), isNull(apiKeys.revokedAt)),
    orderBy: desc(apiKeys.createdAt),
  });

  return key ?? null;
}
