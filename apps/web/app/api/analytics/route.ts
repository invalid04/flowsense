import { getActiveApiKeyForAccount } from "@/lib/getActiveApiKeyForAccount";
import { getOrCreateAccount } from "@/lib/getOrCreateAccount";

export async function GET() {
  try {
    const baseUrl = process.env.SEQUENCE_API_URL;

    if (!baseUrl) {
      return Response.json(
        { error: "SEQUENCE_API_URL is not set" },
        { status: 500 }
      );
    }

    const account = await getOrCreateAccount();
    const apiKey = await getActiveApiKeyForAccount(account.id);

    if (!apiKey) {
      return Response.json(
        { error: "No active API key found for this account" },
        { status: 401 }
      );
    }

    const res = await fetch(`${baseUrl}/analytics`, {
      headers: {
        Authorization: `Bearer ${apiKey.key}`,
      },
      cache: "no-store",
    });

    const data = await res.json();

    return Response.json(data, { status: res.status });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load analytics",
      },
      { status: 500 }
    );
  }
}
