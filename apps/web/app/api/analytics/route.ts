export async function GET() {
  const sequenceApiUrl = process.env.NEXT_PUBLIC_SEQUENCE_API_URL;

  if (!sequenceApiUrl) {
    return Response.json(
      { error: "NEXT_PUBLIC_SEQUENCE_API_URL is not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(`${sequenceApiUrl}/analytics`);
  const data = await res.json();

  return Response.json(data, { status: res.status });
}
