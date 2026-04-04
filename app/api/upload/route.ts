import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions, states, transitions as transitionsTable} from "@/db/schema";

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

        await db.delete(transitionsTable);
        await db.delete(sessions);
        await db.delete(states);

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

        const derivedTransitions: { sessionKey: string; from: string; to: string }[] = [];

        for (const [sessionKey, sessionRows] of sessionsMap.entries()) {
            for (let i = 0; i < sessionRows.length - 1; i++) {
                const current = sessionRows[i];
                const next = sessionRows[i + 1];

                derivedTransitions.push({
                    sessionKey,
                    from: current.state,
                    to: next.state,
                });
            }
        }

        for (const item of derivedTransitions) {
            let session = await db.query.sessions.findFirst({
                where: eq(sessions.sessionKey, item.sessionKey),
            });

            if (!session) {
                const inserted = await db 
                    .insert(sessions)
                    .values({ sessionKey: item.sessionKey })
                    .returning();

                session = inserted[0];
            }

            let fromState = await db.query.states.findFirst({
                where: eq(states.name, item.from),
            });

            if (!fromState) {
                const inserted = await db   
                    .insert(states)
                    .values({ name: item.from })
                    .returning();

                fromState = inserted[0];
            }

            let toState = await db.query.states.findFirst({
                where: eq(states.name, item.to),
            });

            if(!toState) {
                const inserted = await db
                    .insert(states)
                    .values({ name: item.to })
                    .returning();

                toState = inserted[0];
            }

            const existingTransition = await db.query.transitions.findFirst({
                where: and(
                    eq(transitionsTable.sessionId, session.id),
                    eq(transitionsTable.fromStateId, fromState.id),
                    eq(transitionsTable.toStateId, toState.id)
                ),
            });

            if (existingTransition) {
                await db
                    .update(transitionsTable)
                    .set({ count: existingTransition.count + 1 })
                    .where(eq(transitionsTable.id, existingTransition.id))
            } else {
                await db.insert(transitionsTable).values({
                    sessionId: session.id,
                    fromStateId: fromState.id,
                    toStateId: toState.id,
                    count: 1,
                });
            }
        }


        return NextResponse.json({
            message: "Upload processed and transitions saved",
            totalRows: records.length,
            totalSessions: sessionsMap.size,
            totalTransitions: derivedTransitions.length,
        });
    } catch (error) {
        console.error("UPLOAD_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to process uplo0ad" },
            { status: 500 }
        );
    }
}