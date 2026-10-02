import Sidebar from "@/components/dashboard/Sidebar";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata = { title: "Painel - ResolveLabs" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="min-w-0 flex-1">
        {/* Barra superior apenas no mobile, onde a sidebar fica oculta */}
        <div className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 md:hidden">
          <Logo />
          <LogoutButton className="text-sm text-stone-600" />
        </div>
        {children}
      </div>
    </div>
  );
}
