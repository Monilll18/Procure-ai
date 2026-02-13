"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    Truck,
    ClipboardList,
    FileText,
    ShoppingCart,
    BarChart3,
    Settings,
    Brain,
    Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/suppliers", label: "Suppliers", icon: Truck },
    { href: "/inventory", label: "Inventory", icon: ClipboardList },
    { href: "/requisitions", label: "Requests", icon: FileText },
    { href: "/approvals", label: "Approvals", icon: FileText }, // Using FileText for now
    { href: "/purchase-orders", label: "Orders", icon: ShoppingCart },
    { href: "/ai-insights", label: "AI Insights", icon: Brain },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Sidebar Header */}
            <div className="flex h-16 items-center border-b border-sidebar-hover px-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground hover:bg-sidebar-hover mr-2"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                {!collapsed && (
                    <span className="font-bold text-xl tracking-tight">ProcureAI</span>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 p-2">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-hover hover:text-white",
                                isActive
                                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                                    : "text-gray-400 border-l-4 border-transparent",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400")} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section (Dummy) */}
            <div className="border-t border-sidebar-hover p-4">
                {!collapsed ? (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            MJ
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">Manager John</span>
                            <span className="text-xs text-gray-400">Procurement Head</span>
                        </div>
                    </div>
                ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mx-auto">
                        MJ
                    </div>
                )}
            </div>
        </aside>
    );
}
