import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { getOrCreateAccount, UnauthorizedError } from "@/lib/getOrCreateAccount";

function generateApiKey() {
    return "fs_live_" + crypto.randomUUID().replace(/-/g, "");
}

export async function GET() {
    try {
        const account = await getOrCreateAccount();

        const keys = await db.query.apiKeys.findMany({
            where: (table, { eq }) => eq(table.accountId, account.id),
        });

        return NextResponse.json({ keys });
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.error("LIST_API_KEYS_ERROR", error);
        return NextResponse.json(
            { error: "Failed to load API keys" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const account = await getOrCreateAccount();
        const body = await req.json().catch(() => ({}));
        const label = body.label?.trim() || "Default Key";

        const [created] = await db
            .insert(apiKeys)
            .values({
                accountId: account.id,
                key: generateApiKey(),
                label,
            })
            .returning(); 

        return NextResponse.json({ key: created });
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.error("CREATE_API_KEY_ERROR", error);
        return NextResponse.json(
            { error: "Failed to create API key" },
            { status: 500 }
        )
    }
}