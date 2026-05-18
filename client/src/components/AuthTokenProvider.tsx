"use client";

import { useAuth } from "@clerk/nextjs";
import { setTokenProvider } from "@/lib/api";

/**
 * Registers Clerk's getToken as the global token provider for apiFetch.
 * Place this inside any ClerkProvider-wrapped layout (e.g., dashboard layout).
 * All API calls will automatically include the Bearer token.
 */
export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    // Set during render so children's initial useEffects have access to it
    // synchronously before their own useEffects fire.
    setTokenProvider(getToken);

    return <>{children}</>;
}
