"use client";

import { useRouter, usePathname } from "next/navigation";
import Script from "next/script";
import { getBaseUrl } from "@/lib/getBaseUrl";

declare global {
    interface Window {
      FlowSense?: {
        init: (config: { apiKey: string; endpoint?: string }) => void;
        track: (state: string) => Promise<{ message: string }>;
      };
    }
  }

export default function SdkDemoPage() {
  const router = useRouter();
  const pathname = usePathname();
  const baseUrl = getBaseUrl();

  return (
    <main className="min-h-screen space-y-6 p-8">
      <Script
        src={`${baseUrl}/flowsense-sdk.js`}
        strategy="afterInteractive"
        onLoad={() => {
          window.FlowSense?.init({
            apiKey: "fs_live_7f4c431ed21945229a595981ef730d5c",
            endpoint: `${baseUrl}/api/ingest`,
          });
          console.log("FlowSense SDK initialized");
        }}
      />

      <h1 className="text-3xl font-bold">FlowSense SDK Demo</h1>
      <p className="text-gray-600">
        Navigate between pages to simulate real user flows.
      </p>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => router.push("/sdk-demo")} className="btn">
          Home
        </button>
        <button onClick={() => router.push("/sdk-demo/pricing")} className="btn">
          Pricing
        </button>
        <button onClick={() => router.push("/sdk-demo/product")} className="btn">
          Product
        </button>
        <button onClick={() => router.push("/sdk-demo/cart")} className="btn">
          Cart
        </button>
        <button onClick={() => router.push("/sdk-demo/checkout")} className="btn">
          Checkout
        </button>
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Current Page</h2>
        <p className="mt-2 text-gray-500">{pathname}</p>
      </div>
    </main>
  );
}
