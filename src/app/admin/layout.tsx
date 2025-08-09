import React, { Suspense } from "react";
// Server-side guard removed to avoid double redirect with middleware
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <AdminSidebar />
      <div className="pl-[280px]">
        <AdminTopbar />
        <main className="mx-auto max-w-7xl px-8 py-8">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
