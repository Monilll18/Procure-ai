"use client";

import { RBACProvider } from "@/lib/rbac";
import { AuthTokenProvider } from "@/components/AuthTokenProvider";
import AIAssistantElevenLabs from "@/components/AIAssistantElevenLabs";

/**
 * Client-side wrapper for the dashboard layout.
 * Provides RBAC context, auth token injection, and AI chat to all dashboard pages.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <RBACProvider>
            <AuthTokenProvider>
                {children}
            </AuthTokenProvider>
            <AIAssistantElevenLabs />
        </RBACProvider>
    );
}
