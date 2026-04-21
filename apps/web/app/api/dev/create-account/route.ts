import { NextResponse } from "next/server";
import { db } from "@repo/db";
import { accounts } from "@repo/db";

export async function GET() {
  try {
    const account = await db
      .insert(accounts)
      .values({
        name: "Test Account",
        apiKey: "test_key_123",
      })
      .returning();

    return NextResponse.json({
      message: "Account created",
      account,
    });
  } catch (error) {
    console.error("CREATE_ACCOUNT_ERROR", error);

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}