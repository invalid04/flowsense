import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { getOrCreateAccount, UnauthorizedError } from "@/lib/getOrCreateAccount";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function maskApiKey(value: string) {
  if (value.length <= 10) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const account = await getOrCreateAccount();
    const { id } = await context.params;

    const [updated] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.accountId, account.id), isNull(apiKeys.revokedAt)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({
      key: {
        id: updated.id,
        accountId: updated.accountId,
        label: updated.label,
        createdAt: updated.createdAt,
        revokedAt: updated.revokedAt,
        maskedKey: maskApiKey(updated.key),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("REVOKE_API_KEY_ERROR", error);
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }
}
