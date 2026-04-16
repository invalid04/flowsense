import { DashboardTopNav } from "./DashboardTopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="insights-workspace min-h-screen">
      <DashboardTopNav />
      <section className="mx-auto w-full max-w-[88rem] px-4 py-8 md:px-8 md:py-10">
        {children}
      </section>
    </main>
  );
}
