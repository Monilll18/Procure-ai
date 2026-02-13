"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { HeroDashboard } from "@/components/landing/HeroDashboard"; // Import the dashboard component

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden perspective-1000">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/10 blur-[80px] rounded-full pointer-events-none -z-10" />

            <div className="container mx-auto px-6 text-center z-10 relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/30 border border-secondary text-secondary-foreground text-xs font-medium mb-6 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        New: AI-Powered Supplier Scoring
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
                        Smart Procurement for <br className="hidden md:block" />
                        <span className="text-gradient">Modern Enterprises</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Automate your entire procurement lifecycle. From requisition to payment,
                        let AI handle the complexity while you focus on strategy.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full hover:bg-secondary/20 backdrop-blur-sm">
                            Book Demo
                        </Button>
                    </div>
                </motion.div>

                {/* Dashboard Preview (Replaces Floating Cards) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 50, rotateX: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="perspective-1000"
                >
                    <HeroDashboard />
                </motion.div>

            </div>
        </section>
    );
}
