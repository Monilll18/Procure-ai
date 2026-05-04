"use client";

import React from "react";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import MagicRings from "@/components/ui/MagicRings";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

export function Prism() {
    // Track mouse position for the glass button hover effect
    const handleButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty("--x", `${x}px`);
        e.currentTarget.style.setProperty("--y", `${y}px`);
    };

    return (
        <div className="relative w-full h-screen bg-[#010101] overflow-hidden font-sans">
            <style jsx>{`
        @keyframes glowPulse {
          from {
            filter: drop-shadow(0 0 40px rgba(255, 255, 255, 0.4))
              drop-shadow(0 0 80px rgba(138, 43, 226, 0.3));
          }
          to {
            filter: drop-shadow(0 0 60px rgba(255, 255, 255, 0.6))
              drop-shadow(0 0 120px rgba(0, 191, 255, 0.4));
          }
        }
        @keyframes borderFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) rotate(30deg);
          }
          100% {
            transform: translateX(100%) rotate(30deg);
          }
        }
        .animate-glowPulse {
          animation: glowPulse 3s ease-in-out infinite alternate;
        }
        .glass-button {
          /* Initialization for the radial gradient tracking */
          --x: 50%;
          --y: 50%;
        }
        .glass-button::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 40px;
          padding: 1.5px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(138, 43, 226, 0.4) 25%,
            rgba(0, 191, 255, 0.4) 50%,
            rgba(255, 105, 180, 0.4) 75%,
            rgba(255, 255, 255, 0.4) 100%
          );
          background-size: 200% 200%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: borderFlow 3s linear infinite;
          opacity: 0.6;
          transition: opacity 0.5s ease;
        }
        .glass-button::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 40px;
          background: radial-gradient(
            circle at var(--x, 50%) var(--y, 50%),
            rgba(255, 255, 255, 0.2) 0%,
            transparent 50%
          );
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .glass-button:hover::before {
          opacity: 1;
          animation-duration: 2s;
        }
        .glass-button:hover::after {
          opacity: 1;
        }
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 45%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0.1) 55%,
            transparent 100%
          );
          animation: shimmer 3s infinite;
        }
        .glass-button:hover .shimmer-effect {
          animation-duration: 1.5s;
        }
      `}</style>

            {/* Magic Rings Background */}
            <div className="absolute inset-0 z-0">
                <MagicRings
                    color="#00BFFF"     // Cyan match
                    colorTwo="#8A2BE2"  // Violet match (from button gradient)
                    ringCount={7}
                    speed={0.8}
                    attenuation={8}
                    lineThickness={2}
                    baseRadius={0.3}
                    radiusStep={0.08}
                    scaleRate={0.08}
                    opacity={0.8}
                    blur={0.5}
                    noiseAmount={0.05}
                    rotation={0}
                    ringGap={1.4}
                    fadeIn={0.6}
                    fadeOut={0.4}
                    followMouse={true}
                    mouseInfluence={0.3}
                    hoverScale={1.1}
                    parallax={0.1}
                    clickBurst={true}
                />
            </div>

            {/* Content Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center text-white pointer-events-none w-full px-4">
                {/* Title */}
                <h1
                    className={`${instrument.className} font-normal mb-2 animate-glowPulse tracking-tight bg-gradient-to-br from-white via-[#f0f0f0] to-white bg-clip-text text-transparent`}
                    style={{
                        fontSize: "clamp(3.5rem, 10vw, 8rem)",
                    }}
                >
                    PROCURE AI
                </h1>

                {/* Tagline */}
                <p className="text-[clamp(0.9rem,2vw,1.2rem)] font-light tracking-[0.3em] uppercase text-white/90 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                    Intelligent Sourcing
                </p>

                {/* Buttons */}
                <div className="flex justify-center gap-4 md:gap-6 mt-10 pointer-events-auto">
                    {["Discover", "Join Now"].map((text, idx) => (
                        <Link key={idx} href="/sign-up">
                            <button
                                onMouseMove={handleButtonMouseMove}
                                className="glass-button relative px-6 md:px-10 py-3 md:py-4 text-sm md:text-base font-semibold tracking-wider text-white border-[1.5px] border-transparent rounded-[40px] overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-[30px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-[3px] hover:scale-102 hover:shadow-[0_12px_48px_rgba(138,43,226,0.3),0_0_80px_rgba(0,191,255,0.2)] active:-translate-y-px active:scale-98 bg-white/5"
                            >
                                <span className="shimmer-effect absolute -top-1/2 -left-1/2 w-[200%] h-[200%] -rotate-30 pointer-events-none" />
                                <span className="relative z-10">{text}</span>
                            </button>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
