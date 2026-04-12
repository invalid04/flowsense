import { db }  from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAccountByApiKey(apiKey: string) {
    if (!apiKey) return null;

    const account = await db.query.accounts.findFirst({
        where: eq(accounts.apiKey, apiKey),
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