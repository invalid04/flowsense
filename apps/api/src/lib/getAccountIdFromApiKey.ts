import { and, eq, isNull } from "drizzle-orm";
import { apiKeys, db } from "@repo/db";

export async function getAccountIdFromApiKey(authHeader?: string | string[]) {
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!headerValue) return null;

  const prefix = "Bearer ";
  if (!headerValue.startsWith(prefix)) return null;

  const rawKey = headerValue.slice(prefix.length).trim();
  if (!rawKey) return null;

  const keyRecord = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.key, rawKey), isNull(apiKeys.revokedAt)),
  });

  if (!keyRecord) return null;

  return keyRecord.accountId;
}
