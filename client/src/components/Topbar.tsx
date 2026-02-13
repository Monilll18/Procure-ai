"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-6 shadow-sm">
            {/* Left: Page Title or Breadcrumb (Placeholder) */}
            <div className="flex items-center gap-4">
                {/* Could be dynamic based on route */}
                <h1 className="text-lg font-semibold text-foreground">Overview</h1>
            </div>

            {/* Right: Search + Actions */}
            <div className="flex items-center gap-4">
                <div className="relative hidden w-64 md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search anything..."
                        className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
                    />
                </div>

                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                </Button>
            </div>
        </header>
    );
}
