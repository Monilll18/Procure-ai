import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

import { DashboardShell } from "@/components/DashboardShell";

export const metadata: Metadata = {
    title: "Dashboard - AI Procurement SaaS",
    description: "Overview of your procurement operations",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <DashboardShell>
            <div className="flex min-h-screen bg-background text-foreground font-['DM_Sans',sans-serif]">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden h-screen">
                    {/* Topbar */}
                    <Topbar />

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-[24px]">
                        {children}
                    </main>

                </div>
            </div>
        </DashboardShell>
    );
}
