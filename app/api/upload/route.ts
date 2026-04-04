import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

type CsvRow = {
    session_id: string;
    state: string;
    timestamp: string;
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "CSV file is required" },
                { status: 400 }
            );
        }

        if (!file.name.endsWith(".csv")) {
            return NextResponse.json(
                { error: "Only CSV files are supported" },
                { status: 400 } 
            );
        }  

        const text = await file.text();

        const records = parse(text, {
            columns: true,
            skip_empty_lines: true, 
            trim: true,
        }) as CsvRow[];

        if (records.length === 0) {
            return NextResponse.json(
                { error: "CSV file is empty" },
                { status: 400 }
            );
        }

        const requiredColumns = ["session_id", "state", "timestamp"];
        const firstRow = records[0];

        for (const column of requiredColumns) {
            if (!(column in firstRow)) {
                return NextResponse.json(
                    { error: `Missing required column: ${column}` },
                    { status: 400 }
                );
            }
        }

        const sessionsMap = new Map<string, CsvRow[]>();

        for (const row of records) {
            if (!sessionsMap.has(row.session_id)) {
                sessionsMap.set(row.session_id, []);
            }
            sessionsMap.get(row.session_id)!.push(row);
        }

        for (const sessionRows of sessionsMap.values()) {
            sessionRows.sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
            );
        }

        const transitions: { from: string; to: string }[] = [];

        for (const sessionRows of sessionsMap.values()) {
            for (let i = 0; i < sessionRows.length - 1; i++) {
                const current = sessionRows[i];
                const next = sessionRows[i + 1];

                transitions.push({
                    from: current.state,
                    to: next.state,
                });
            }
        }

        return NextResponse.json({
            message: "Transitions generated",
            totalRows: records.length,
            totalSessions: sessionsMap.size,
            totalTransitions: transitions.length,
            sampleTransitions: transitions.slice(0, 5),
        });
    } catch (error) {
        console.error("UPLOAD_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to process uplo0ad" },
            { status: 500 }
        );
    }
}