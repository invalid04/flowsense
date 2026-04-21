export async function GET(req: Request) {
  const sequenceApiUrl = process.env.NEXT_PUBLIC_SEQUENCE_API_URL;

  if (!sequenceApiUrl) {
    return Response.json(
      { error: "NEXT_PUBLIC_SEQUENCE_API_URL is not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const res = await fetch(
    `${sequenceApiUrl}/state-transitions?${searchParams.toString()}`
  );
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
