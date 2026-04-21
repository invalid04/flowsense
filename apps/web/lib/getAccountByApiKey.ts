import { db }  from "@repo/db";
import { accounts, apiKeys } from "@repo/db";
import { and, eq, isNull } from "drizzle-orm";

export async function getAccountByApiKey(apiKey: string) {
    if (!apiKey) return null;

    const apiKeyRow = await db.query.apiKeys.findFirst({
        where: and(eq(apiKeys.key, apiKey), isNull(apiKeys.revokedAt))
    });

    if (!apiKeyRow) return null;

    const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, apiKeyRow.accountId),
    });

    return account ?? null;
}

export function extractApiKey(req: Request) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) return null;

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") return null;

    return parts[1];
}

