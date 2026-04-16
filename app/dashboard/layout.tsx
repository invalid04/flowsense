import { DashboardSidebar } from "./DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="enterprise-grid min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="dashboard-shell mx-auto grid w-full max-w-[108rem] grid-cols-1 gap-5">
        <DashboardSidebar />
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
