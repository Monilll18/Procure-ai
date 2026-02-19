"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Zap, Check } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define the available themes with their descriptions and preview colors
const themes = [
    { name: "Midnight", class: "", color: "bg-slate-950 border-slate-700" }, // Default
    { name: "Ocean", class: "theme-ocean", color: "bg-cyan-600" },
    { name: "Royal", class: "theme-royal", color: "bg-pink-600" },
    { name: "Forest", class: "theme-forest", color: "bg-emerald-600" },
    { name: "Sunset", class: "theme-sunset", color: "bg-orange-600" },
];

export function ThemeSelector() {
    const [activeTheme, setActiveTheme] = useState("");
    const [performanceMode, setPerformanceMode] = useState(false);

    useEffect(() => {
        // Clean up all theme classes first
        themes.forEach(t => {
            if (t.class) document.body.classList.remove(t.class);
        });

        // Apply new theme class if selected (empty string is default)
        if (activeTheme) {
            document.body.classList.add(activeTheme);
        }
    }, [activeTheme]);

    return (
        <div className="fixed bottom-24 right-6 z-40">
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 animate-spin-slow ring-4 ring-background">
                        <Settings className="h-6 w-6" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mr-4 border-border/50 shadow-2xl backdrop-blur-3xl bg-background/90" side="top" align="end">
                    <div className="p-4 border-b border-border/50">
                        <h4 className="font-semibold text-foreground">Design System</h4>
                        <p className="text-xs text-muted-foreground">Select a complete visual theme</p>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Color Selection */}
                        <div className="space-y-3">
                            <Label>Active Theme</Label>
                            <div className="flex gap-3 flex-wrap">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.name}
                                        onClick={() => setActiveTheme(theme.class)}
                                        title={theme.name}
                                        className={`h-10 w-10 rounded-xl ${theme.color} flex items-center justify-center transition-all duration-300 hover:scale-110 ring-offset-2 ring-offset-background ${activeTheme === theme.class ? 'ring-2 ring-foreground scale-110 shadow-lg' : 'ring-0 opacity-80 hover:opacity-100'}`}
                                    >
                                        {activeTheme === theme.class && <Check className="h-5 w-5 text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Performance Mode */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    Power Saver
                                </Label>
                                <p className="text-[10px] text-muted-foreground">Reduce animation load</p>
                            </div>
                            <Switch
                                checked={performanceMode}
                                onCheckedChange={setPerformanceMode}
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-b-lg border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-semibold">
                            Instant Preview
                        </p>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
