"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { Instrument_Serif } from "next/font/google";
import ScrollRevealText from "@/components/ui/ScrollRevealText";
import { GlowCard } from "@/components/ui/spotlight-card";
import Link from "next/link";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

const plans = [
    {
        name: "Starter",
        monthlyPrice: "$29",
        yearlyPrice: "$199",
        desc: "Perfect for small teams getting started.",
        features: ["User analytics", "Growth tracking", "Real-time reporting", "1 Project"],
        popular: false
    },
    {
        name: "Growth",
        monthlyPrice: "$79",
        yearlyPrice: "$599",
        desc: "Advanced analytics for scaling businesses.",
        features: ["Everything in Starter", "Funnel analysis", "Custom events", "Priority support", "5 Projects"],
        popular: true
    },
    {
        name: "Enterprise",
        monthlyPrice: "$199",
        yearlyPrice: "$1599",
        desc: "Complete analytics solution for large orgs.",
        features: ["Everything in Growth", "SSO & SAML", "Dedicated manager", "Unlimited Projects", "Raw data access"],
        popular: false
    }
];

function TiltPricingCard({ plan, index, isYearly }: { plan: typeof plans[number]; index: number; isYearly: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const scale = useSpring(1, { damping: 40, stiffness: 200 });

    const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;
        const maxTilt = 4;
        const rawX = (offsetY / (rect.height / 2)) * -maxTilt;
        const rawY = (offsetX / (rect.width / 2)) * maxTilt;
        rotateX.set(Math.max(-maxTilt, Math.min(maxTilt, rawX)));
        rotateY.set(Math.max(-maxTilt, Math.min(maxTilt, rawY)));
    }, [rotateX, rotateY]);

    const handleEnter = useCallback(() => {
        scale.set(1.02);
    }, [scale]);

    const handleLeave = useCallback(() => {
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
    }, [scale, rotateX, rotateY]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 }}
            style={{ perspective: 800 }}
            className={`flex ${index === 1 ? "md:translate-y-2" : ""}`}
        >
            <motion.div
                ref={ref}
                onMouseMove={handleMouse}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                style={{
                    rotateX,
                    rotateY,
                    scale,
                    transformStyle: "preserve-3d",
                }}
                className={`relative w-full rounded-2xl flex flex-col transition-shadow duration-300 cursor-default ${
                    plan.popular ? "z-10" : ""
                }`}
            >
                <GlowCard
                    customSize
                    glowColor="blue"
                    className={`flex flex-col h-full w-full p-8 ${
                        plan.popular ? "border-zinc-500 ring-2 ring-zinc-500/20" : "border-zinc-800"
                    } !bg-zinc-900/40 supports-[backdrop-filter]:!bg-zinc-900/30`}
                >
                    {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2" style={{ transform: "translateZ(40px) translateX(-50%)" }}>
                            <Badge className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-none">
                                Most Popular
                            </Badge>
                        </div>
                    )}

                    <motion.div style={{ transform: "translateZ(20px)" }} className="flex flex-col h-full">
                        <div className="mb-4 inline-flex items-center self-start gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-300">{plan.name}</span>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                            <p className="text-sm text-zinc-400 mt-2">{plan.desc}</p>
                        </div>

                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                            <span className="text-zinc-500">/{isYearly ? "year" : "month"}</span>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, j) => (
                                <li key={j} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <Check className="h-4 w-4 text-zinc-400" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href="/sign-up" className="w-full mt-auto block">
                            <Button
                                className={`w-full ${
                                    plan.popular
                                        ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-none"
                                        : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-none"
                                }`}
                                variant={plan.popular ? "default" : "outline"}
                            >
                                Get Started
                            </Button>
                        </Link>
                    </motion.div>
                </GlowCard>
            </motion.div>
        </motion.div>
    );
}

export function Pricing() {
    const [isYearly, setIsYearly] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const setSize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            const w = Math.max(1, Math.floor(rect?.width ?? window.innerWidth));
            const h = Math.max(1, Math.floor(rect?.height ?? window.innerHeight));
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        setSize();

        type P = { x: number; y: number; v: number; o: number };
        let parts: P[] = [];
        let raf = 0;

        const make = (): P => ({
            x: Math.random() * (canvas.width / (window.devicePixelRatio || 1)),
            y: Math.random() * (canvas.height / (window.devicePixelRatio || 1)),
            v: Math.random() * 0.25 + 0.05,
            o: Math.random() * 0.35 + 0.15,
        });

        const init = () => {
            parts = [];
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            const count = Math.floor((w * h) / 12000);
            for (let i = 0; i < count; i++) parts.push(make());
        };

        const draw = () => {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            ctx.clearRect(0, 0, w, h);
            parts.forEach((p) => {
                p.y -= p.v;
                if (p.y < 0) {
                    p.x = Math.random() * w;
                    p.y = h + Math.random() * 40;
                    p.v = Math.random() * 0.25 + 0.05;
                    p.o = Math.random() * 0.35 + 0.15;
                }
                ctx.fillStyle = `rgba(250,250,250,${p.o})`;
                ctx.fillRect(p.x, p.y, 0.7, 2.2);
            });
            raf = requestAnimationFrame(draw);
        };

        const onResize = () => {
            setSize();
            init();
        };

        const ro = new ResizeObserver(onResize);
        ro.observe(canvas.parentElement || document.body);

        init();
        raf = requestAnimationFrame(draw);
        return () => {
            ro.disconnect();
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <section id="pricing" className="relative min-h-screen py-24 md:py-32 bg-[#010101] text-zinc-50 overflow-hidden isolate">
            <style>{`
                .pricing-section[data-locked]{ color:#f6f7f8; color-scheme:dark }
                .accent-lines{position:absolute;inset:0;pointer-events:none;opacity:.7}
                .hline,.vline{position:absolute;background:#27272a}
                .hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .6s ease forwards}
                .vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .7s ease forwards}
                .hline:nth-child(1){top:18%;animation-delay:.08s}
                .hline:nth-child(2){top:50%;animation-delay:.16s}
                .hline:nth-child(3){top:82%;animation-delay:.24s}
                .vline:nth-child(4){left:18%;animation-delay:.20s}
                .vline:nth-child(5){left:50%;animation-delay:.28s}
                .vline:nth-child(6){left:82%;animation-delay:.36s}
                @keyframes drawX{to{transform:scaleX(1)}}
                @keyframes drawY{to{transform:scaleY(1)}}
            `}</style>

            {/* Subtle vignette */}
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(80%_60%_at_50%_15%,rgba(255,255,255,0.06),transparent_60%)]" />

            {/* Animated accent lines */}
            <div aria-hidden className="accent-lines">
                <div className="hline" />
                <div className="hline" />
                <div className="hline" />
                <div className="vline" />
                <div className="vline" />
                <div className="vline" />
            </div>

            {/* Particles */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-50 pointer-events-none"
            />

            <div className="relative container mx-auto px-6">
                <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center"
                    >
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-zinc-800 bg-white/5 text-xs font-medium text-zinc-300 mb-6 backdrop-blur-sm">
                            PRICING PLANS
                        </div>
                        <ScrollRevealText className={`${instrument.className} text-5xl md:text-7xl font-normal text-white mb-6 leading-[0.95] tracking-[-1px]`}>
                            Start free, scale smart
                        </ScrollRevealText>
                        <p className="text-zinc-400 text-lg">
                            Choose the perfect plan for your startup. Upgrade as you grow.
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-3 text-sm font-medium mt-4 z-10 relative">
                        <span className={!isYearly ? "text-white" : "text-zinc-400"}>Monthly</span>
                        <Switch 
                            checked={isYearly} 
                            onCheckedChange={() => setIsYearly(!isYearly)} 
                            className="data-[state=checked]:bg-zinc-100 data-[state=unchecked]:bg-zinc-800 [&>span]:data-[state=checked]:bg-zinc-900 [&>span]:data-[state=unchecked]:bg-zinc-400"
                        />
                        <span className={isYearly ? "text-white" : "text-zinc-400"}>Yearly</span>
                        <Badge className="ml-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/30 transition-colors">
                            Save up to 42%
                        </Badge>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch z-10 relative">
                    {plans.map((plan, i) => (
                        <TiltPricingCard key={i} plan={plan} index={i} isYearly={isYearly} />
                    ))}
                </div>
            </div>
        </section>
    );
}
