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
    ChevronLeft,
    FolderTree,
    Building2,
    Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { useRBAC } from "@/lib/rbac";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    procurement_officer: "Officer",
    approver: "Finance",
    viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-500/15 text-red-400 border border-red-500/30",
    manager: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    procurement_officer: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    approver: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    viewer: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30",
};

type NavGroup = {
    group: string;
    items: { href: string; label: string; description: string; icon: any; perm: string }[];
};

const navGroups: NavGroup[] = [
    {
        group: "Core",
        items: [
            { href: "/dashboard", label: "Dashboard", description: "System overview and key metrics", icon: LayoutDashboard, perm: "view_dashboard" },
            { href: "/analytics", label: "Analytics", description: "Deep dive into procurement data", icon: BarChart3, perm: "view_analytics" },
            { href: "/ai-insights", label: "AI Insights", description: "AI generated insights and alerts", icon: Brain, perm: "view_ai_insights" },
        ]
    },
    {
        group: "Source to Pay",
        items: [
            { href: "/requisitions", label: "Requests", description: "Manage internal purchase requests", icon: FileText, perm: "view_requisitions" },
            { href: "/approvals", label: "Approvals", description: "Review and approve pending items", icon: FileText, perm: "view_approvals" },
            { href: "/purchase-orders", label: "Orders", description: "Track and manage purchase orders", icon: ShoppingCart, perm: "view_purchase_orders" },
        ]
    },
    {
        group: "Supply Chain",
        items: [
            { href: "/products", label: "Products", description: "Manage product catalog and pricing", icon: Package, perm: "view_products" },
            { href: "/suppliers", label: "Suppliers", description: "Manage vendor relationships", icon: Truck, perm: "view_suppliers" },
            { href: "/inventory", label: "Inventory", description: "Monitor stock levels and locations", icon: ClipboardList, perm: "view_inventory" },
        ]
    },
    {
        group: "System",
        items: [
            { href: "/settings", label: "Settings", description: "Configure system preferences and users", icon: Settings, perm: "view_settings" },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useUser();
    const { role, can } = useRBAC();

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-border bg-card text-foreground transition-all duration-300 relative z-40",
                collapsed ? "w-[80px]" : "w-[280px]"
            )}
        >
            {/* Sidebar Header */}
            <div className="flex h-[64px] items-center justify-between px-4 border-b border-border">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="relative h-10 w-10 flex items-center justify-center overflow-hidden">
                            <img src="/logo-icon.png" alt="ProcureAI Logo" className="object-contain w-full h-full scale-125" />
                        </div>
                        <span className="font-[700] text-[18px] text-foreground tracking-[-0.02em]">ProcureAI</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-[34px] w-[34px] rounded-[8px] bg-secondary hover:bg-muted text-muted-foreground transition-[0.15s_ease]", collapsed && "mx-auto")}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
            </div>

            {/* Navigation Links */}
            <TooltipProvider delayDuration={0}>
                <nav className="flex-1 p-3 overflow-y-auto pt-4 space-y-6">
                    {navGroups.map((group) => {
                        const visibleItems = group.items.filter((item) => can(item.perm));
                        if (visibleItems.length === 0) return null;
                        
                        return (
                            <div key={group.group} className="space-y-1">
                                {!collapsed && (
                                    <div className="px-2 pb-2">
                                        <span className="text-[10px] uppercase text-muted-foreground tracking-[0.08em] font-[600]">{group.group}</span>
                                    </div>
                                )}
                                {visibleItems.map((item) => {
                                    const isActive = pathname.startsWith(item.href);
                                    
                                    const linkContent = (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-[6px] px-[12px] py-[9px] text-[13px] transition-[0.15s_ease] group",
                                                isActive
                                                    ? "bg-primary/10 text-primary font-[600]"
                                                    : "text-muted-foreground font-[400] hover:bg-secondary hover:text-foreground",
                                                collapsed && "justify-center px-2"
                                            )}
                                        >
                                            <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    );

                                    if (collapsed) {
                                        return (
                                            <Tooltip key={item.href}>
                                                <TooltipTrigger asChild>
                                                    {linkContent}
                                                </TooltipTrigger>
                                                <TooltipContent side="right" sideOffset={16} className="bg-zinc-900 dark:bg-zinc-800 text-zinc-50 border-zinc-800 py-2.5 px-3 rounded-[12px] shadow-xl z-50">
                                                    <div className="flex flex-col gap-0.5 max-w-[200px]">
                                                        <span className="font-semibold text-[13px]">{item.label}</span>
                                                        <span className="text-[11px] text-zinc-400 font-medium leading-[1.3]">{item.description}</span>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }

                                    return linkContent;
                                })}
                            </div>
                        );
                    })}
                </nav>
            </TooltipProvider>

        </aside>
    );
}
