export function getBaseUrl() {
  const fallback = "https://flowsense-five.vercel.app/";
  const raw = (process.env.NEXT_PUBLIC_APP_URL || fallback).replace(/\/+$/, "");

  if (/localhost|127\.0\.0\.1/i.test(raw)) {
    return fallback.replace(/\/+$/, "");
  }

  return raw;
}
