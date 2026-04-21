export async function POST(req: Request) {
  const sequenceApiUrl = process.env.NEXT_PUBLIC_SEQUENCE_API_URL;

  if (!sequenceApiUrl) {
    return Response.json(
      { error: "NEXT_PUBLIC_SEQUENCE_API_URL is not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const res = await fetch(`${sequenceApiUrl}/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
