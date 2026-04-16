import { NextResponse } from "next/server";
import { processCsvText } from "@/lib/processUploadCsv";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

const SAMPLE_CSV = `session_id,state,timestamp
s1,/landing,2026-04-01T09:00:00Z
s1,/pricing,2026-04-01T09:01:10Z
s1,/signup,2026-04-01T09:03:00Z
s1,/dashboard,2026-04-01T09:05:00Z
s2,/landing,2026-04-01T10:15:00Z
s2,/features,2026-04-01T10:16:00Z
s2,/pricing,2026-04-01T10:18:30Z
s2,/signup,2026-04-01T10:20:00Z
s3,/landing,2026-04-01T11:00:00Z
s3,/blog,2026-04-01T11:02:00Z
s3,/features,2026-04-01T11:05:00Z
s3,/dashboard,2026-04-01T11:08:00Z
s4,/landing,2026-04-01T12:20:00Z
s4,/pricing,2026-04-01T12:21:00Z
s4,/pricing,2026-04-01T12:21:45Z
s4,/signup,2026-04-01T12:23:00Z
s5,/landing,2026-04-01T13:05:00Z
s5,/features,2026-04-01T13:07:30Z
s5,/dashboard,2026-04-01T13:10:00Z`;

export async function POST() {
  try {
    const account = await getOrCreateAccount();
    const summary = await processCsvText(SAMPLE_CSV, account.id);

    return NextResponse.json({
      message: "Sample dataset loaded",
      ...summary,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("SAMPLE_UPLOAD_ROUTE_ERROR", error);
    const message = error instanceof Error ? error.message : "Failed to load sample dataset";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
