"use client";

import { Marquee } from "@/components/ui/marquee";
import { Combine, Command, Box, Hexagon, Layers, Aperture } from "lucide-react";

const partners = [
    { name: "Acme Corp", icon: Combine },
    { name: "GlobalTech", icon: Command },
    { name: "CubeSystems", icon: Box },
    { name: "HexaLab", icon: Hexagon },
    { name: "StackSoft", icon: Layers },
    { name: "ApertureScience", icon: Aperture },
];

export function Partners() {
    const items = partners.map((p, i) => (
        <div key={i} className="flex items-center gap-3 px-8">
            <p.icon className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-xl font-bold text-muted-foreground/50">{p.name}</span>
        </div>
    ));

    return (
        <section className="py-12 bg-background border-b border-border/40">
            <div className="container mx-auto px-6 mb-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">TRUSTED BY INNOVATIVE TEAMS AT</p>
            </div>
            <div className="relative flex h-20 w-full flex-col items-center justify-center overflow-hidden antialiased">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                <Marquee items={items} direction="left" speed="normal" className="w-full text-foreground" />
            </div>
        </section>
    );
}
