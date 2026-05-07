import type { Metadata } from "next";
import SandboxRuntime from "./sandbox-runtime";

export const metadata: Metadata = {
  title: "Sequence Sandbox",
  description: "Live behavioral runtime demo for Sequence.",
};

export default function SandboxPage() {
  return <SandboxRuntime />;
}

