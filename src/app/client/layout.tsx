import ClientHeader from "@/components/layout/ClientHeader";
import ClientSidebar from "@/components/layout/ClientSidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader />
      <div className="flex">
        <ClientSidebar />
        <main className="flex-1 md:ml-72 p-8">{children}</main>
      </div>
    </div>
  );
}
