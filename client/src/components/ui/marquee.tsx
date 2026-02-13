"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const Marquee = ({
    items,
    direction = "left",
    speed = "normal",
    pauseOnHover = true,
    className,
}: {
    items: React.ReactNode[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const duration =
        speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";

    const animStyle: React.CSSProperties & { "--duration"?: string } = {
        "--duration": duration,
    };

    return (
        <div
            className={cn("group flex overflow-hidden", className)}
            style={animStyle}
        >
            {/* Strip 1 */}
            <div
                className={cn(
                    "flex shrink-0 items-center gap-6 animate-marquee",
                    direction === "right" && "[animation-direction:reverse]",
                    pauseOnHover && "group-hover:[animation-play-state:paused]"
                )}
            >
                {items.map((item, i) => (
                    <div key={`a-${i}`} className="flex-shrink-0">
                        {item}
                    </div>
                ))}
            </div>

            {/* Strip 2 — identical copy for seamless loop */}
            <div
                className={cn(
                    "flex shrink-0 items-center gap-6 animate-marquee",
                    direction === "right" && "[animation-direction:reverse]",
                    pauseOnHover && "group-hover:[animation-play-state:paused]"
                )}
            >
                {items.map((item, i) => (
                    <div key={`b-${i}`} className="flex-shrink-0">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};
