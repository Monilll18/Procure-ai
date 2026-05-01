"use client";

import { Brain, Zap, Shield, ArrowRight } from "lucide-react";
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
        title: "AI-Powered Spend Intelligence",
        subtitle: "See what others miss",
        description:
            "Real-time AI analysis surfaces hidden savings, flags anomalies, and generates actionable recommendations across every category — automatically.",
        image: "/features/ai-insights.png",
        accent: "from-blue-500/20 to-violet-500/20",
        border: "border-blue-500/30",
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-400",
        stats: [
            { label: "Avg. Savings Found", value: "32%" },
            { label: "Time to Insight", value: "<2s" },
        ],
    },
    {
        Icon: Zap,
        title: "Automated Approval Workflows",
        subtitle: "From days to minutes",
        description:
            "Intelligent routing adapts to your org hierarchy. Auto-escalation, parallel approvals, and conditional logic — no bottleneck goes unresolved.",
        image: "/features/automation.png",
        accent: "from-amber-500/20 to-orange-500/20",
        border: "border-amber-500/30",
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-400",
        stats: [
            { label: "Approval Speed", value: "12x faster" },
            { label: "Manual Steps Removed", value: "87%" },
        ],
    },
    {
        Icon: Shield,
        title: "3-Way Invoice Matching",
        subtitle: "Zero discrepancies slip through",
        description:
            "Automatic cross-validation of Purchase Orders, Invoices, and Goods Receipts. AI flags mismatches instantly, saving hours of manual reconciliation.",
        image: "/features/matching.png",
        accent: "from-emerald-500/20 to-green-500/20",
        border: "border-emerald-500/30",
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        stats: [
            { label: "Match Accuracy", value: "99.7%" },
            { label: "Fraud Caught", value: "$2.4M+" },
        ],
    },
];

export function Features() {
    return (
        <section id="features" className="relative bg-[#010101]">
            {/* Section header */}
            <div className="container mx-auto px-6 pt-24 pb-16 text-center max-w-3xl">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-400 mb-6 backdrop-blur-sm tracking-wider uppercase">
                    Platform Capabilities
                </div>
                <ScrollRevealText
                    className={`${instrument.className} text-4xl md:text-6xl lg:text-7xl font-normal text-white mb-6 leading-[0.95] tracking-[-1px]`}
                >
                    Everything you need to optimize procurement
                </ScrollRevealText>
                <p className="text-zinc-400 text-lg">
                    Explore the core capabilities that set ProcureAI apart.
                </p>
            </div>

            {/* Sticky stack cards */}
            <div className="relative pb-24">
                {featureCards.map((feature, idx) => (
                    <div
                        key={idx}
                        className="sticky"
                        style={{ top: `${80 + idx * 24}px` }}
                    >
                        <div className="container mx-auto px-4 md:px-6 max-w-5xl pb-8">
                            <div
                                className={`rounded-2xl border ${feature.border} bg-[#0a0a0a] overflow-hidden shadow-2xl`}
                                style={{
                                    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    {/* Left: Content */}
                                    <div className="flex flex-col justify-center p-8 md:p-12 gap-5">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-11 h-11 rounded-xl ${feature.iconBg} flex items-center justify-center flex-shrink-0`}
                                            >
                                                <feature.Icon
                                                    className={`w-5 h-5 ${feature.iconColor}`}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                                                {feature.subtitle}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                                                {feature.title}
                                            </h3>
                                            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>

                                        <div className="flex gap-8 mt-1">
                                            {feature.stats.map((stat, si) => (
                                                <div key={si}>
                                                    <div className="text-2xl md:text-3xl font-bold text-white">
                                                        {stat.value}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-1">
                                                        {stat.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors w-fit group mt-2">
                                            Learn more
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>

                                    {/* Right: Image */}
                                    <div
                                        className={`relative bg-gradient-to-br ${feature.accent} overflow-hidden min-h-[260px] md:min-h-[360px]`}
                                    >
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
                                        <img
                                            src={feature.image}
                                            alt={feature.title}
                                            className="absolute inset-0 w-full h-full object-cover object-center"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Spacer so the sticky cards have room to stack */}
                <div style={{ height: "40vh" }} aria-hidden />
            </div>
        </section>
    );
}
