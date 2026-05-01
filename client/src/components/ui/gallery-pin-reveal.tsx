"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface PinCard {
    color: string;
    title: string;
    description?: string;
    img: string;
}

interface GalleryPinRevealProps {
    cards?: PinCard[];
    backgroundColor?: string;
    scrollHintText?: string;
    scrollHintSubtext?: string;
}

const GalleryPinReveal: React.FC<GalleryPinRevealProps> = ({
    cards = [
        { color: "#c8a882", title: "Ignite", description: "Start your journey", img: "https://images.unsplash.com/photo-1775533222841-095c4e19ceaf?w=800&auto=format&fit=crop&q=80&ixlib=rb-4.1.0" },
        { color: "#7da8a0", title: "Growth", description: "Scale effortlessly", img: "https://images.unsplash.com/photo-1775315815915-43af175d4c95?w=800&auto=format&fit=crop&q=80&ixlib=rb-4.1.0" },
        { color: "#8b9fd4", title: "Depth",  description: "Deep analytics", img: "https://images.unsplash.com/photo-1774847897731-ad86ff58390b?w=800&auto=format&fit=crop&q=80&ixlib=rb-4.1.0" },
        { color: "#c4a3bf", title: "Pulse",  description: "Real-time updates", img: "https://images.unsplash.com/photo-1773318427480-1058e1059f99?w=800&auto=format&fit=crop&q=80&ixlib=rb-4.1.0" },
    ],
    backgroundColor = "inherit",
    scrollHintText = "Scroll Down",
    scrollHintSubtext = "↓",
}) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef });

    return (
        <div ref={containerRef} className="h-[400vh] min-h-screen relative" style={{ backgroundColor }}>
            {/* Scroll Down Indicator */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 2, duration: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
                <div className="text-foreground text-center">
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-2xl md:text-4xl font-bold mb-4 font-outfit"
                    >
                        {scrollHintText}
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="text-lg md:text-xl text-foreground/60"
                    >
                        {scrollHintSubtext}
                    </motion.div>
                </div>
            </motion.div>

            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden py-10">
                {cards.map((card, i) => {
                    const isLast = i === cards.length - 1;
                    const factor = 1 / cards.length;
                    
                    const rangeStart = i * factor;
                    const rangeEnd = rangeStart + factor;

                    // Ensure mappings never exceed 1.0 to prevent WAAPI keyframe offset errors
                    const safeScaleStart = isLast ? 0.99 : rangeEnd;
                    const safeScaleEnd = isLast ? 1.0 : rangeEnd + factor;

                    const y = useTransform(scrollYProgress, [rangeStart, rangeEnd], ["100%", "0%"]);
                    const scale = useTransform(scrollYProgress, [safeScaleStart, safeScaleEnd], [1, isLast ? 1 : 0.9]);
                    const opacity = useTransform(scrollYProgress, [safeScaleStart, safeScaleEnd], [1, isLast ? 1 : 0.5]);

                    return (
                        <motion.div
                            key={i}
                            style={{ y, scale, opacity, zIndex: i, backgroundColor: card.color }}
                            className="absolute w-[90vw] md:w-[600px] aspect-[4/5] rounded-[3rem] flex items-center justify-center shadow-2xl p-8 overflow-hidden"
                        >
                            <img
                                src={card.img}
                                alt={card.title}
                                className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                            />
                            <div className="relative w-full h-full border-4 border-black/20 rounded-[2.5rem] flex flex-col items-center justify-between p-12 overflow-hidden bg-black/30 backdrop-blur-md">
                                <div className="w-full flex justify-between text-white font-bold uppercase z-10 tracking-widest text-sm">
                                    <span>0{i + 1}</span>
                                    <span>{card.description || "Collection"}</span>
                                </div>
                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter z-10 text-center font-outfit leading-tight drop-shadow-xl">{card.title}</h1>
                                <div className="w-20 h-20 rounded-full border-4 border-white/50 animate-spin-slow z-10 border-t-white" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default GalleryPinReveal;
