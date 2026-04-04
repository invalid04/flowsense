"use client";

import { useState } from "react";

type PredictionResponse = {
    currentState: string;
    prediction: string | null;
    probability: number | null;
    totalTransitions?: number;
    message?: string;
    error?: string;
};

export function PredictionPanel() {
    const [currentState, setCurrentState] = useState("/home");
    const [result, setResult] = useState<PredictionResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const res = await fetch(`/api/predict?currentState=${encodeURIComponent(currentState)}`);

        const data = await res.json();
        setResult(data);
        setLoading(false);
    };

    return (
        <div className='rounded-2xl border p-4'>
            <h2 className='mb-3 text-xl font-semibold'>Prediction</h2>

            <form onSubmit={handlePredict} className='flex flex-wrap gap-2'>
                <input 
                    className='rounded border px-3 py-2'
                    value={currentState} 
                    onChange={(e) => setCurrentState(e.target.value)} 
                    placeholder="Current State" 
                />
                <button 
                    className='rounded bg-black px-4 py-2 text-white'
                    type="submit" 
                    disabled={loading} 
                >
                    {loading ? "Predicting..." : "Predict"}
                </button>
            </form>

            {result && (
                <div className='mt-4 rounded-xl border p-4'>
                    {"error" in result && result.error ? (
                        <p>{result.error}</p>
                    ) : result.prediction ? (
                        <>
                            <p>
                                <span className='font-semibold'>Current state:</span>{" "}
                                {result.currentState}
                            </p>
                            <p>
                                <span className='font-semibold'>Predicted next state</span>{" "}
                                {result.prediction}
                            </p>
                            <p>
                                <span className='font-semibold'>Probability:</span>{" "}
                            </p>
                            <p>
                                <span>Probability:</span>{" "}
                                {((result.probability ?? 0) * 100).toFixed(1)}%
                            </p>
                        </>
                    ) : (
                        <p>{result.message ?? "No prediction available."}</p>
                    )}
                </div>
            )}
        </div>
    )
}