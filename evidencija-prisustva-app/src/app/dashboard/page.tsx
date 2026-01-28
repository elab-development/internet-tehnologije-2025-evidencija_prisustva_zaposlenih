import Sidebar from "@/components/layout/Sidebar";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-secondary-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold text-secondary-800">
          Evidencija nastave
        </h1>

        {/* Ovde kasnije ide kalendar */}
      </main>
    </div>
  );
}
