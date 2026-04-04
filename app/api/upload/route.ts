import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

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
        })

        return NextResponse.json({
            message: "CSV parsed successfully",
            totalRows: records.length,
            sample: records.slice(0, 5),
        });
    } catch (error) {
        console.error("UPLOAD_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to process uplo0ad" },
            { status: 500 }
        );
    }
}