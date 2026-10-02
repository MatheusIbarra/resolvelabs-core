import Header from "@/components/Header";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = { title: "Admin - ResolveLabs" };

export default function AdminDashboardPage() {
  return (
    <>
      <Header />
      <main className="page-container flex-1 py-10 pb-20">
        <AdminDashboard />
      </main>
    </>
  );
}
