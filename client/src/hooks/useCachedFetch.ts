/**
 * useCachedFetch — Zero-flash data fetching hook.
 *
 * Problem it solves:
 *   Even when data is in the in-memory apiCache, calling an async function
 *   inside useEffect always shows a loading skeleton for one render cycle.
 *   This hook reads the cache SYNCHRONOUSLY during useState initialization,
 *   so if cached data exists the component renders with real data on the
 *   very first paint — no skeleton flash at all.
 *
 * Behaviour:
 *   - Cache HIT  → renders instantly with data, no skeleton, no network call,
 *                  then silently re-validates in background if TTL is close
 *   - Cache MISS → shows skeleton, fetches, caches, re-renders with data
 *   - Error      → returns error string, data stays null
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { apiCache } from "@/lib/api";

interface UseCachedFetchOptions {
    /** Cache key — usually the API endpoint string, e.g. "/api/products/" */
    cacheKey: string;
    /** Async function that fetches fresh data from the backend */
    fetcher: () => Promise<any>;
    /**
     * If true, even on cache hits, a background re-fetch is triggered
     * after the component mounts. Keeps data fresh without blocking UI.
     * Default: false
     */
    revalidateOnMount?: boolean;
    /** Dependencies that trigger a fresh fetch (like filter params). Default: [] */
    deps?: any[];
}

interface UseCachedFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    /** Call this after a mutation to force a fresh fetch and re-render */
    refresh: () => void;
}

export function useCachedFetch<T>({
    cacheKey,
    fetcher,
    revalidateOnMount = false,
    deps = [],
}: UseCachedFetchOptions): UseCachedFetchResult<T> {
    // ── 1. Synchronous cache read during state initialization ──────────────
    // This runs BEFORE the first render, not inside useEffect.
    // If cached data exists, `data` is pre-populated and `loading` is false.
    // The component will paint with real data on the very first render.
    const [data, setData] = useState<T | null>(() => {
        return apiCache.get<T>(cacheKey);
    });
    const [loading, setLoading] = useState<boolean>(() => {
        return apiCache.get<T>(cacheKey) === null;
    });
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchFresh = useCallback(
        async (showSpinner: boolean) => {
            if (showSpinner) setLoading(true);
            setError(null);
            try {
                const result = await fetcher();
                if (isMounted.current) {
                    setData(result);
                }
            } catch (err: any) {
                if (isMounted.current) {
                    setError(err?.message || "Failed to load data");
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cacheKey, ...deps]
    );

    useEffect(() => {
        isMounted.current = true;
        const hasCachedData = apiCache.get<T>(cacheKey) !== null;

        if (!hasCachedData) {
            // Cache miss: fetch with spinner
            fetchFresh(true);
        } else if (revalidateOnMount) {
            // Cache hit but stale revalidation requested: fetch silently
            fetchFresh(false);
        }
        // Cache hit + no revalidation → do nothing, data already rendered

        return () => {
            isMounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, revalidateOnMount, ...deps]);

    const refresh = useCallback(() => {
        // Invalidate cache and force fresh fetch with spinner
        apiCache.invalidate(cacheKey);
        setData(null);
        fetchFresh(true);
    }, [cacheKey, fetchFresh]);

    return { data, loading, error, refresh };
}
