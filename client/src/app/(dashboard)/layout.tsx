import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

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
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <Topbar />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-[#F5F5F7]">
                    {children}
                </main>
            </div>
        </div>
    );
}
