"use client";

import Link from "next/link";
import { Instrument_Serif, Inter } from "next/font/google";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-inter",
});

export function Hero() {
    return (
        <section className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden ${inter.className}`}>
            <style jsx>{`
                .liquid-glass {
                    background: rgba(255, 255, 255, 0.01);
                    background-blend-mode: luminosity;
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    border: none;
                    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                .liquid-glass::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    padding: 1.4px;
                    background: linear-gradient(180deg,
                        rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
                        rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
                        rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    pointer-events: none;
                }
                @keyframes fade-rise {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-rise { animation: fade-rise 0.8s ease-out both; }
                .animate-fade-rise-delay { animation: fade-rise 0.8s ease-out 0.2s both; }
                .animate-fade-rise-delay-2 { animation: fade-rise 0.8s ease-out 0.4s both; }
            `}</style>

            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source
                        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
                        type="video/mp4"
                    />
                </video>
                {/* Overlay Scrim for readability */}
                <div className="absolute inset-0 bg-background/50 pointer-events-none" />
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-40 w-full max-w-7xl mx-auto">
                {/* Main Headline */}
                <h1
                    className={`${instrument.className} text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-4xl font-normal text-foreground animate-fade-rise`}
                >
                    Where <em className="not-italic text-muted-foreground">strategy</em> rises <em className="not-italic text-muted-foreground">through the data.</em>
                </h1>

                {/* Subtext */}
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
                    We're designing tools for procurement leaders, bold negotiators, and quiet strategists. Amid the chaos, we build digital spaces for sharp focus and inspired sourcing.
                </p>

                {/* Custom CTA Button */}
                <Link 
                    href="/sign-in" 
                    className="liquid-glass rounded-full px-14 py-5 text-base text-foreground mt-12 transition-transform duration-300 hover:scale-[1.03] cursor-pointer animate-fade-rise-delay-2 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.06)]"
                >
                    Begin Sourcing
                </Link>
            </div>
        </section>
    );
}
