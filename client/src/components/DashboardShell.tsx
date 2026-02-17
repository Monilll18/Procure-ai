"use client";

import { RBACProvider } from "@/lib/rbac";
import { AIChatWidget } from "@/components/AIChatWidget";

/**
 * Client-side wrapper for the dashboard layout.
 * Provides RBAC context and AI chat to all dashboard pages.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <RBACProvider>
            {children}
            <AIChatWidget />
        </RBACProvider>
    );
}
