"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Globe, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import ScrollRevealText from "@/components/ui/ScrollRevealText";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

const featureCards = [
    {
        Icon: Brain,
        label: "AI Intelligence",
        title: "AI-Powered\nSpend Intelligence",
        description: "Real-time AI analysis surfaces hidden savings, flags anomalies, and generates actionable recommendations across every category.",
        poster: "/features/ai-insights.png",
        gradient: "from-blue-950/70 via-blue-950/40 to-zinc-950/80",
        stats: [
            { label: "Avg. Savings", value: "32%" },
            { label: "Time to Insight", value: "<2s" },
        ],
    },
    {
        Icon: Zap,
        label: "Automation",
        title: "Automated\nApproval Workflows",
        description: "Intelligent routing adapts to your org hierarchy. Auto-escalation, parallel approvals, and conditional logic — no bottleneck goes unresolved.",
        poster: "/features/automation.png",
        gradient: "from-amber-950/70 via-amber-950/40 to-zinc-950/80",
        stats: [
            { label: "Approval Speed", value: "12x faster" },
            { label: "Steps Removed", value: "87%" },
        ],
    },
    {
        Icon: Globe,
        label: "Supplier Network",
        title: "Global\nSupplier Network",
        description: "Discover, evaluate, and onboard suppliers across 112 countries. Risk scoring, compliance tracking, and multi-currency management built in.",
        poster: "/features/sourcing.png",
        gradient: "from-teal-950/70 via-teal-950/40 to-zinc-950/80",
        stats: [
            { label: "Countries", value: "112" },
            { label: "Avg. Rating", value: "4.6★" },
        ],
    },
    {
        Icon: Shield,
        label: "Invoice Matching",
        title: "3-Way Invoice\nMatching",
        description: "Automatic cross-validation of Purchase Orders, Invoices, and Goods Receipts. AI flags mismatches instantly, saving hours of manual reconciliation.",
        poster: "/features/matching.png",
        gradient: "from-emerald-950/70 via-emerald-950/40 to-zinc-950/80",
        stats: [
            { label: "Match Accuracy", value: "99.7%" },
            { label: "Fraud Caught", value: "$2.4M+" },
        ],
    },
];

/* ─── Single FlipperRow (2 cards) ─── */
function FlipperRow({ features }: { features: typeof featureCards }) {
    const [activeCard, setActiveCard] = useState<number | null>(null);

    const handleClick = (side: number) => {
        setActiveCard(activeCard === side ? null : side);
    };

    return (
        <div className="flex gap-2.5 h-[420px]">
            {features.map((feature, side) => {
                const isExpanded = activeCard === side;
                const isCollapsed = activeCard !== null && activeCard !== side;

                return (
                    <motion.div
                        key={side}
                        className="relative rounded-[20px] overflow-hidden cursor-pointer"
                        animate={{
                            flex: isExpanded ? 3 : isCollapsed ? 1 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                        onClick={() => handleClick(side)}
                    >
                        {/* Interactive UI Mockup Image */}
                        <img
                            src={feature.poster}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover -z-[1]"
                        />

                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient}`} />

                        {/* ── Top bar: glassmorphic pill + arrow ── */}
                        <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
                            {/* Pill badge */}
                            <div
                                className="flex items-center gap-2 pl-2.5 pr-3.5 py-[7px] rounded-full"
                                style={{
                                    background: "rgba(255,255,255,0.12)",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                            >
                                <feature.Icon className="w-[14px] h-[14px] text-white/80" />
                                <span className="text-[12px] font-medium text-white/90 leading-none">{feature.label}</span>
                            </div>

                            {/* Arrow button */}
                            <button
                                className="w-9 h-9 rounded-full flex items-center justify-center"
                                style={{
                                    background: "rgba(255,255,255,0.12)",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClick(side);
                                }}
                            >
                                {isExpanded ? (
                                    <ArrowLeft className="w-[14px] h-[14px] text-white/80" />
                                ) : (
                                    <ArrowRight className="w-[14px] h-[14px] text-white/80" />
                                )}
                            </button>
                        </div>

                        {/* ── Bottom content ── */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                            <AnimatePresence mode="wait">
                                {isExpanded ? (
                                    <motion.div
                                        key="expanded"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 12 }}
                                        transition={{ duration: 0.25, delay: 0.12 }}
                                    >
                                        <h3 className={`${instrument.className} text-[32px] lg:text-[38px] text-white leading-[1.05] mb-2 whitespace-pre-line`}>
                                            {feature.title}
                                        </h3>
                                        <p className="text-white/55 text-[13px] leading-relaxed max-w-[420px] mb-5">
                                            {feature.description}
                                        </p>
                                        {/* Floating stat cards */}
                                        <div className="flex gap-2.5">
                                            {feature.stats.map((stat, si) => (
                                                <div
                                                    key={si}
                                                    className="px-4 py-3 rounded-[14px]"
                                                    style={{
                                                        background: "rgba(255,255,255,0.08)",
                                                        backdropFilter: "blur(16px)",
                                                        WebkitBackdropFilter: "blur(16px)",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                                                    }}
                                                >
                                                    <div className="text-[18px] font-bold text-white leading-none">{stat.value}</div>
                                                    <div className="text-[10px] text-white/45 uppercase tracking-wider mt-1.5">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="collapsed"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <h3 className={`${instrument.className} ${isCollapsed ? "text-[20px]" : "text-[26px] lg:text-[30px]"} text-white leading-[1.08] whitespace-pre-line transition-all duration-300`}>
                                            {feature.title}
                                        </h3>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

/* ─── Mobile card ─── */
function MobileCard({ feature }: { feature: typeof featureCards[number] }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            className="relative rounded-[20px] overflow-hidden cursor-pointer"
            animate={{ height: expanded ? 400 : 180 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            onClick={() => setExpanded(!expanded)}
        >
            <img src={feature.poster} alt="" className="absolute inset-0 w-full h-full object-cover -z-[1]" />
            <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient}`} />

            {/* Badge */}
            <div className="absolute top-4 left-4 z-10">
                <div
                    className="flex items-center gap-2 pl-2.5 pr-3.5 py-[7px] rounded-full"
                    style={{
                        background: "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                    }}
                >
                    <feature.Icon className="w-[14px] h-[14px] text-white/80" />
                    <span className="text-[12px] font-medium text-white/90">{feature.label}</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                <h3 className={`${instrument.className} text-xl text-white leading-[1.08] whitespace-pre-line`}>
                    {feature.title}
                </h3>
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ delay: 0.1 }}
                        >
                            <p className="text-white/55 text-[13px] leading-relaxed mt-2 mb-3">{feature.description}</p>
                            <div className="flex gap-2.5">
                                {feature.stats.map((stat, si) => (
                                    <div
                                        key={si}
                                        className="px-3 py-2 rounded-xl"
                                        style={{
                                            background: "rgba(255,255,255,0.08)",
                                            backdropFilter: "blur(16px)",
                                            WebkitBackdropFilter: "blur(16px)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                        }}
                                    >
                                        <div className="text-base font-bold text-white">{stat.value}</div>
                                        <div className="text-[10px] text-white/45 uppercase tracking-wider">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export function Features() {
    return (
        <section id="features" className="relative bg-[#010101] z-[1]" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 1200px" }}>
            {/* Header */}
            <div className="container mx-auto px-6 pt-24 pb-12 text-center max-w-3xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-border/30 bg-white/[0.03] text-xs font-semibold text-muted-foreground mb-6 backdrop-blur-sm tracking-wider uppercase">
                        Platform Capabilities
                    </div>
                    <ScrollRevealText className={`${instrument.className} text-4xl md:text-6xl lg:text-7xl font-normal text-foreground mb-6 leading-[0.95] tracking-[-1px]`}>
                        Everything you need to optimize procurement
                    </ScrollRevealText>
                </motion.div>
            </div>

            {/* Desktop: 2 rows × 2 cards */}
            <div className="container mx-auto px-4 md:px-6 max-w-6xl pb-24 hidden md:flex flex-col gap-2.5">
                <FlipperRow features={[featureCards[0], featureCards[1]]} />
                <FlipperRow features={[featureCards[2], featureCards[3]]} />
            </div>

            {/* Mobile: stacked */}
            <div className="container mx-auto px-4 pb-24 md:hidden flex flex-col gap-3">
                {featureCards.map((f, i) => (
                    <MobileCard key={i} feature={f} />
                ))}
            </div>
        </section>
    );
}
