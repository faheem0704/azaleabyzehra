import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SessionProvider from "@/components/providers/SessionProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-[#F8F5F0]">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-4 pt-16 md:pt-8 md:p-8 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
