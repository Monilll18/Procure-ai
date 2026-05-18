"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
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
    const sectionRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Pause video when Hero scrolls out of view to free GPU/CPU
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            },
            { threshold: 0.05 }
        );

        observer.observe(video);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden ${inter.className}`}
            style={{ contain: "paint layout", willChange: "auto" }}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes hero-fade-rise {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hero-animate-fade-rise { animation: hero-fade-rise 0.8s ease-out both; }
                .hero-animate-fade-rise-delay { animation: hero-fade-rise 0.8s ease-out 0.2s both; }
                .hero-animate-fade-rise-delay-2 { animation: hero-fade-rise 0.8s ease-out 0.4s both; }

                .hero-luma-button {
                    position: relative;
                    background: transparent;
                    border-radius: 9999px;
                    z-index: 1;
                    overflow: hidden;
                    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
                    transition: all 0.3s ease;
                }
                .hero-luma-button::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 300%;
                    height: 300%;
                    background: conic-gradient(from 0deg, transparent 55%, rgba(138, 43, 226, 1) 65%, rgba(0, 191, 255, 1) 78%, transparent 88%);
                    transform: translate(-50%, -50%);
                    animation: hero-spin 3s linear infinite;
                    z-index: -2;
                }
                .hero-luma-button::after {
                    content: '';
                    position: absolute;
                    inset: 1.5px;
                    background: rgba(5, 5, 5, 0.92);
                    border-radius: 9999px;
                    z-index: -1;
                    backdrop-filter: blur(10px);
                    transition: background 0.3s ease;
                }
                @keyframes hero-spin {
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                .hero-luma-button:hover::after {
                    background: rgba(15, 15, 15, 0.85);
                }
                .hero-luma-button:hover {
                    box-shadow: 0 0 30px rgba(0, 191, 255, 0.35), 0 0 60px rgba(138, 43, 226, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.25) inset;
                    transform: scale(1.04);
                }
            ` }} />

            {/* Background Video — GPU-promoted layer */}
            <div className="absolute inset-0 z-0" style={{ transform: "translateZ(0)" }}>
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                    style={{ transform: "translate3d(0,0,0)" }}
                >
                    <source
                        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
                        type="video/mp4"
                    />
                </video>
                {/* Overlay Scrim for readability */}
                <div className="absolute inset-0 bg-[#010101]/50 pointer-events-none" />
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-40 w-full max-w-7xl mx-auto">
                {/* Main Headline */}
                <h1
                    className={`${instrument.className} text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-4xl font-normal text-white hero-animate-fade-rise`}
                >
                    Where strategy rises through the data.
                </h1>

                {/* Subtext */}
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed hero-animate-fade-rise-delay">
                    We&apos;re designing tools for procurement leaders, bold negotiators, and quiet strategists. Amid the chaos, we build digital spaces for sharp focus and inspired sourcing.
                </p>

                {/* Custom CTA Button */}
                <Link 
                    href="/sign-in" 
                    className="hero-luma-button rounded-full px-14 py-5 text-base font-medium text-white mt-12 cursor-pointer hero-animate-fade-rise-delay-2 flex items-center justify-center gap-2"
                >
                    Begin Sourcing
                </Link>
            </div>
        </section>
    );
}
