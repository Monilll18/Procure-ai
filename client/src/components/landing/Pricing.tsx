"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

const plans = [
    {
        name: "Starter",
        price: "$29",
        desc: "Perfect for small teams getting started.",
        features: ["User analytics", "Growth tracking", "Real-time reporting", "1 Project"],
        popular: false
    },
    {
        name: "Growth",
        price: "$79",
        desc: "Advanced analytics for scaling businesses.",
        features: ["Everything in Starter", "Funnel analysis", "Custom events", "priority support", "5 Projects"],
        popular: true
    },
    {
        name: "Enterprise",
        price: "$199",
        desc: "Complete analytics solution for large orgs.",
        features: ["Everything in Growth", "SSO & SAML", "Dedicated manager", "Unlimited Projects", "Raw data access"],
        popular: false
    }
];

export function Pricing() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "center center"]
    });

    // Smooth out the scroll progress
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Calculate transforms based on smoothed scroll position
    // Start widely spread and converge to 0
    const leftX = useTransform(smoothProgress, [0, 1], [-150, 0]);
    const rightX = useTransform(smoothProgress, [0, 1], [150, 0]);
    const opacity = useTransform(smoothProgress, [0, 0.4], [0, 1]);
    const scale = useTransform(smoothProgress, [0, 1], [0.85, 1]);

    return (
        <section id="pricing" className="py-24 bg-background relative overflow-hidden">
            {/* Subtle background glow to replace the dark box */}
            <div className="absolute inset-0 bg-primary/5 -z-10 blur-3xl opacity-50 pointer-events-none" />

            <div className="container mx-auto px-6" ref={containerRef}>
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div style={{ opacity: opacity, scale: scale }}>
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground mb-4">
                            PRICING PLANS
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                            Start free, scale smart
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Choose the perfect plan for your startup. Upgrade as you grow.
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => {
                        // Determine animation style based on position
                        // 0 = Left (Starter), 1 = Center (Growth), 2 = Right (Enterprise)
                        const style = i === 0 ? { x: leftX, opacity } :
                            i === 2 ? { x: rightX, opacity } :
                                { opacity, scale };

                        return (
                            <motion.div
                                key={i}
                                style={style}
                                className={`relative rounded-2xl border bg-background p-8 shadow-sm flex flex-col hover:shadow-xl transition-all duration-300 ${plan.popular ? 'border-primary ring-2 ring-primary/20 scale-105 z-10' : 'border-border'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">Most Popular</Badge>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
                                </div>

                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Check className="h-4 w-4 text-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                                    Get Started
                                </Button>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
