"use client";

import ClientHeader from "@/components/layout/ClientHeader";
import ClientSidebar from "@/components/layout/ClientSidebar";
import { useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader onMenuClick={() => setMobileSidebarOpen(true)} />
      <div className="flex">
        <ClientSidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <main className="flex-1 md:ml-72 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
