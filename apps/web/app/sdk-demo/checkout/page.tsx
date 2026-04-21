"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <main className="min-h-screen p-8 space-y-6">
      <h1 className="text-3xl font-bold">Page</h1>

      <div className="flex gap-3">
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

      <p className="text-gray-500">
        {pathname}
      </p>
    </main>
  );
}