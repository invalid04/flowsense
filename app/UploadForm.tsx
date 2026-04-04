"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setMessage("Please choose a CSV file");
            return;
        }

        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            setMessage(data.error ?? "Upload failed.");
            setLoading(false);
            return;
        }

        setMessage(
            `Upload successful. Rows: ${data.totalRows}, Sessions: ${data.totalSessions}, Transitions: ${data.totalTransitions}`
        );
        setLoading(false);
        router.refresh();
    };

    return (
        <div className='rounded-2xl border p-4'>
            <h2 className='mb-3 text-xl font-semibold'>Upload Event Data</h2>

            <form
                onSubmit={handleSubmit}
                className='flex flex-wrap gap-2'
            >
                <input 
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className='rounded border px-3 py-2'
                />
                <button
                    type="submit"
                    disabled={loading}
                    className='rounded bg-black px-4 py-2 text-white'
                >
                    {loading ? "Uploading..." : "Upload CSV"}
                </button>
            </form>

            {message && <p className='mt-3 text-sm'>{message}</p>}
        </div>
    )
}