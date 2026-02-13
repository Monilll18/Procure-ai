"use client";

import { motion } from "framer-motion";
import { BarChart, Activity, Users, DollarSign, Package, Bell, Search, Menu, TrendingUp, ShieldCheck } from "lucide-react";

export function HeroDashboard() {
    return (
        <div className="relative max-w-5xl mx-auto mt-16 z-20">

            {/* Search/Command Floating Pill - Top Center */}
            <motion.div
                className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 bg-background/80 backdrop-blur-md border border-primary/20 shadow-xl py-2 px-4 rounded-full flex items-center gap-3 hidden md:flex"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Search suppliers...</span>
                <div className="flex gap-1 ml-4">
                    <span className="text-[10px] border border-border px-1.5 rounded bg-muted text-muted-foreground">⌘</span>
                    <span className="text-[10px] border border-border px-1.5 rounded bg-muted text-muted-foreground">K</span>
                </div>
            </motion.div>

            {/* Main Dashboard Window - Gentle Float */}
            <motion.div
                className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* Mock Browser Header */}
                <div className="h-10 bg-muted/80 border-b border-border flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="mx-auto w-1/2 h-6 bg-background/50 rounded-md text-[10px] flex items-center justify-center text-muted-foreground font-mono">
                        procure-ai.com/dashboard
                    </div>
                </div>

                {/* Mock App Interface */}
                <div className="flex h-[500px] md:h-[600px] bg-background">
                    {/* Mock Sidebar */}
                    <div className="w-16 md:w-64 border-r border-border bg-card/50 flex flex-col p-4 gap-4 hidden md:flex">
                        <div className="h-8 w-8 bg-primary rounded-lg mb-6 shadow-lg shadow-primary/20" />

                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`h-8 w-full rounded-md flex items-center gap-3 px-2 ${i === 1 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}>
                                <div className={`w-4 h-4 rounded ${i === 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                <div className={`h-2 w-24 rounded-full ${i === 1 ? 'bg-primary/50' : 'bg-muted-foreground/20'}`} />
                            </div>
                        ))}
                    </div>

                    {/* Mock Main Content */}
                    <div className="flex-1 p-4 md:p-8 overflow-hidden bg-background relative">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { color: "text-blue-500", icon: DollarSign, label: "Total Spend", val: "$1.2M" },
                                { color: "text-emerald-500", icon: Activity, label: "Savings", val: "$142k" },
                                { color: "text-orange-500", icon: Package, label: "Open Orders", val: "24" },
                                { color: "text-purple-500", icon: Users, label: "Suppliers", val: "156" },
                            ].map((stat, i) => (
                                <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/20 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                    <div className="text-2xl font-bold text-foreground">{stat.val}</div>
                                    <div className="h-1 w-full bg-secondary mt-3 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/50 w-[70%] rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Area */}
                        <div className="grid md:grid-cols-3 gap-6 h-full">
                            <div className="md:col-span-2 p-6 rounded-xl border border-border bg-card shadow-sm h-64 relative overflow-hidden group">
                                <div className="flex justify-between mb-6">
                                    <div className="font-semibold text-sm">Monthly Spend Analysis</div>
                                </div>
                                {/* Mock Bar Chart */}
                                <div className="flex items-end gap-3 h-40 w-full mt-4 justify-between px-2">
                                    {[40, 70, 45, 90, 60, 80, 50, 95, 65, 85].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            viewport={{ once: true }}
                                            className="w-full bg-primary/20 rounded-t-sm hover:bg-primary transition-colors relative"
                                        >
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-xl border border-border bg-card shadow-sm h-64">
                                <div className="font-semibold text-sm mb-6">Recent Activity</div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                                <div className="w-2 h-2 bg-primary rounded-full" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-2 w-20 bg-foreground/20 rounded-full mb-1" />
                                                <div className="h-2 w-12 bg-muted-foreground/20 rounded-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Floating Pop-out Card 1: Savings Alert (Left) */}
            <motion.div
                className="absolute -left-12 top-40 p-4 rounded-xl bg-card border border-border shadow-2xl w-48 hidden md:block glass ring-1 ring-white/10"
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-emerald-500/20 rounded-md text-emerald-500"><TrendingUp className="w-4 h-4" /></div>
                    <div className="text-left">
                        <p className="font-bold text-xs">New Savings</p>
                        <p className="text-[10px] text-muted-foreground">Just now</p>
                    </div>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-500">+$12,450</div>
            </motion.div>

            {/* Floating Pop-out Card 2: Approvals (Right) */}
            <motion.div
                className="absolute -right-8 bottom-32 p-4 rounded-xl bg-card border border-border shadow-2xl w-56 hidden md:block glass ring-1 ring-white/10"
                animate={{ y: [0, -25, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
                <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-xs text-foreground">Pending Approval</p>
                    <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-[10px] font-bold">Urgent</span>
                </div>
                <div className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border border-border/50">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <div>
                        <div className="text-xs font-medium">Q1 Server Hardware</div>
                        <div className="text-[10px] text-muted-foreground">$45,000 • Dell Inc.</div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
