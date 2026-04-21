import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@repo/db";
import { accounts } from "@repo/db";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getOrCreateAccount() {
  const { userId } = await auth();

  if (!userId) {
    throw new UnauthorizedError();
  }

  let account = await db.query.accounts.findFirst({
    where: eq(accounts.apiKey, userId),
  });

  if (!account) {
    const [newAccount] = await db
      .insert(accounts)
      .values({
        name: "New User",
        apiKey: userId,
      })
      .returning();

    account = newAccount;
  }

  return account;
}

