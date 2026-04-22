import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

export async function GET(req: Request) {
  try {
    const sequenceApiUrl = process.env.SEQUENCE_API_URL;
    const internalSecret = process.env.SEQUENCE_INTERNAL_SECRET;

    if (!sequenceApiUrl) {
      return Response.json(
        { error: "SEQUENCE_API_URL is not set" },
        { status: 500 }
      );
    }

    if (!internalSecret) {
      return Response.json(
        { error: "SEQUENCE_INTERNAL_SECRET is not set" },
        { status: 500 }
      );
    }

    const account = await getOrCreateAccount();
    const { searchParams } = new URL(req.url);
    const res = await fetch(
      `${sequenceApiUrl}/state-transitions?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${internalSecret}`,
          "x-sequence-account-id": account.id,
        },
        cache: "no-store",
      }
    );
    const data = await res.json();

    return Response.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("STATE_TRANSITIONS_PROXY_ROUTE_ERROR", error);
    return Response.json(
      { error: "Failed to load state transitions" },
      { status: 500 }
    );
  }
}
