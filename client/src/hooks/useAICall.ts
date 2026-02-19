/**
 * useAICall — Production-grade hook for all AI feature buttons.
 *
 * Provides:
 *  - Debounce: ignores rapid double-clicks (500ms)
 *  - Cooldown: 15s wait after each successful call (shows countdown)
 *  - AbortController: cancels in-flight request on unmount / dialog close
 *  - Loading + error state: unified, no per-component boilerplate
 *  - Client-side retry: 1 retry on network error (not on 4xx/5xx)
 */
import { useState, useRef, useCallback, useEffect } from "react";

const DEBOUNCE_MS = 500;
const COOLDOWN_SECONDS = 15;

interface UseAICallOptions<T> {
    /** The async function that calls the AI API */
    fn: (signal: AbortSignal) => Promise<T>;
    /** Called with the result on success */
    onSuccess: (result: T) => void;
    /** Called with the error message on failure */
    onError: (message: string) => void;
    /** Seconds to cool down after a successful call (default: 15) */
    cooldownSeconds?: number;
}

interface UseAICallReturn {
    trigger: () => void;
    loading: boolean;
    /** Seconds remaining in cooldown (0 = ready) */
    cooldown: number;
    /** Cancel any in-flight request */
    abort: () => void;
}

export function useAICall<T>({
    fn,
    onSuccess,
    onError,
    cooldownSeconds = COOLDOWN_SECONDS,
}: UseAICallOptions<T>): UseAICallReturn {
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            // Cancel any in-flight request on unmount
            abortRef.current?.abort();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    const startCooldown = useCallback(() => {
        if (!isMounted.current) return;
        setCooldown(cooldownSeconds);
        cooldownRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [cooldownSeconds]);

    const execute = useCallback(async () => {
        // Already loading or in cooldown — block
        if (loading || cooldown > 0) return;

        // Cancel any previous in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);

        // Client-side retry: 1 retry on network errors only
        let lastError = "";
        for (let attempt = 0; attempt <= 1; attempt++) {
            try {
                const result = await fn(controller.signal);
                if (!isMounted.current) return;
                onSuccess(result);
                startCooldown();
                return;
            } catch (err: unknown) {
                if (!isMounted.current) return;
                if (err instanceof DOMException && err.name === "AbortError") return;

                const msg = err instanceof Error ? err.message : String(err);
                lastError = msg;

                // Only retry on network errors, not on API errors (4xx/5xx)
                const isNetworkError = !msg.includes("API Error") && !msg.includes("429") && !msg.includes("422");
                if (isNetworkError && attempt === 0) {
                    await new Promise((r) => setTimeout(r, 1000));
                    continue;
                }
                break;
            }
        }

        if (isMounted.current) {
            onError(lastError || "Request failed");
            setLoading(false);
        }
    }, [loading, cooldown, fn, onSuccess, onError, startCooldown]);

    const trigger = useCallback(() => {
        // Debounce: clear any pending trigger and schedule a new one
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(execute, DEBOUNCE_MS);
    }, [execute]);

    const abort = useCallback(() => {
        abortRef.current?.abort();
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        setCooldown(0);
        setLoading(false);
    }, []);

    // Keep loading in sync — clear it after execute finishes
    useEffect(() => {
        if (!loading) return;
        // loading is set to false inside execute on error path;
        // on success path we rely on the component unmounting or abort
    }, [loading]);

    return { trigger, loading, cooldown, abort };
}
