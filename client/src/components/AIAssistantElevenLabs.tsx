"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiChat, aiHealth } from "@/lib/api";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    Mic,
    MoreHorizontal,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/lib/rbac";
import { useUser } from "@clerk/nextjs";
import { supplierAiChat } from "@/lib/supplier-api";

interface Props {
    isSupplierPortal?: boolean;
    externalUser?: { fullName: string | null; role: string };
}

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    intent?: string;
    timestamp: Date;
}

const GREETING_PATTERNS = /^\s*(h(i|ey|ello|yy|ii|ola)|yo|sup|what'?s? ?up|good\s*(morning|evening|afternoon)|greetings|howdy|namaste)\s*[!?.]*\s*$/i;

const ROLE_SUGGESTIONS: Record<string, string[]> = {
    admin: [
        "How much did we spend this month?",
        "Which supplier has the most orders?",
        "Show me fraud scan results",
        "What's the team's approval backlog?",
    ],
    manager: [
        "How much did we spend this month?",
        "Which supplier is cheapest for paper?",
        "Show me all overdue deliveries",
        "What items are low in stock?",
    ],
    procurement_officer: [
        "What items are low in stock?",
        "How many purchase orders are pending?",
        "Which supplier is cheapest for paper?",
    ],
    approver: [
        "How many POs need approval?",
        "What's our budget utilization?",
        "Show spend by category",
    ],
    viewer: [
        "How do I create a purchase request?",
        "What does this dashboard show?",
        "How do I track an order?",
    ],
    supplier: [
        "What's the status of my orders?",
        "How do I update my prices?",
        "How do I respond to a purchase order?",
    ],
};

// --- Main Component ---

export default function AIAssistantElevenLabs({ isSupplierPortal, externalUser }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    // Identity & RBAC — safe for both Clerk (internal) and Supplier Portal contexts
    let clerkUser: any = null;
    let internalRole = "viewer";
    try {
        if (!isSupplierPortal) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const clerkHook = useUser();
            clerkUser = clerkHook.user;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const rbacHook = useRBAC();
            internalRole = rbacHook.role;
        }
    } catch {
        // Outside ClerkProvider — supplier portal context, safe to ignore
    }
    
    const userName = isSupplierPortal ? (externalUser?.fullName || "Supplier") : (clerkUser?.fullName || "User");
    const role = isSupplierPortal ? "supplier" : internalRole;

    // Check AI health on mount
    useEffect(() => {
        aiHealth()
            .then((res) => setIsConfigured(res.llm_configured))
            .catch(() => setIsConfigured(false));
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: "welcome",
                    role: "assistant",
                    content: "👋 Hi! I'm your AI procurement assistant. How can I help you today?",
                    timestamp: new Date(),
                },
            ]);
        }
    }, [isOpen]);

    const sendMessage = async (text?: string) => {
        const question = text || input.trim();
        if (!question || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: question,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        // Handle greetings client-side → no LLM call
        if (GREETING_PATTERNS.test(question)) {
            const greetReply: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Hey ${userName.split(" ")[0]}! 👋 How can I help you with procurement today?`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, greetReply]);
            return;
        }

        setIsLoading(true);

        try {
            const res = isSupplierPortal 
                ? await supplierAiChat(question)
                : await aiChat(question, userName, role);
                
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: res.answer ? "assistant" : "system",
                content: res.answer || "⚠️ AI service unavailable — please check your configuration.",
                intent: res.answer ? res.intent : undefined,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "system",
                    content: `Error: ${err.message || "Please try again."}`,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Trigger Button (ElevenLabs Style) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 border border-primary transition-all hover:bg-primary/90 hover:scale-105"
                    >
                        <Bot className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Main Assistant Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 flex w-[400px] flex-col overflow-hidden rounded-[32px] border border-border dark:border-[#2e3347] bg-card dark:bg-[#0f1117] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
                        style={{ height: "min(600px, calc(100vh - 100px))" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                                    AI Assistant
                                </span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content Area — Chat Only */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex flex-col gap-2",
                                            msg.role === "user" ? "items-end" : "items-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-relaxed shadow-sm",
                                                msg.role === "user"
                                                    ? "bg-zinc-100 text-black font-medium"
                                                    : msg.role === "system"
                                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    : "bg-zinc-800/80 text-zinc-100 backdrop-blur-md border border-zinc-700/50"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex flex-col items-start gap-2">
                                        <div className="bg-zinc-800 rounded-[20px] px-5 py-4">
                                            <div className="flex gap-1.5">
                                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Role-aware Suggested Questions */}
                        {messages.length <= 1 && !isLoading && (
                            <div className="px-6 py-2 overflow-x-auto no-scrollbar">
                                <div className="flex gap-2 w-max">
                                    {(ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.viewer).map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(q)}
                                            className="whitespace-nowrap rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Section */}
                        <div className="p-6 pt-2">
                            <div className="relative flex items-center">
                                <textarea
                                    ref={inputRef}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Message assistant..."
                                    className="w-full resize-none rounded-2xl border border-border dark:border-[#2e3347] bg-secondary dark:bg-[#252837] py-3 pl-4 pr-12 text-sm text-foreground dark:text-white placeholder-muted-foreground outline-none transition-all focus:border-primary"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black transition-all hover:scale-105 disabled:opacity-20"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <div className="mt-3 flex items-center justify-between px-1">
                                <p className="text-[10px] text-zinc-600">
                                    Powered by GROQ & ElevenLabs Aesthetics
                                </p>
                                {isConfigured === false && (
                                    <span className="text-[10px] text-amber-500/80 font-medium">
                                        AI Offline
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
