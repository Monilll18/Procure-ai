"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, ShoppingCart, Truck, DollarSign, FileText,
    Settings, LogOut, Menu, ChevronLeft, Building2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    getStoredSupplierUser, clearSupplierSession,
    type SupplierAuthUser,
} from "@/lib/supplier-api";
import AIAssistantElevenLabs from "@/components/AIAssistantElevenLabs";
import { ModeToggle } from "@/components/ThemeToggle";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const portalNav = [
    { href: "/supplier-portal/dashboard", label: "Dashboard", description: "View your metrics and tasks", icon: LayoutDashboard },
    { href: "/supplier-portal/purchase-orders", label: "Purchase Orders", description: "Manage POs from the buyer", icon: ShoppingCart },
    { href: "/supplier-portal/shipments", label: "Shipments", description: "Track and update deliveries", icon: Truck },
    { href: "/supplier-portal/catalog", label: "Catalog & Pricing", description: "Manage products and prices", icon: DollarSign },
    { href: "/supplier-portal/invoices", label: "Invoices", description: "Submit and track invoices", icon: FileText },
];

export default function SupplierPortalLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<SupplierAuthUser | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Allow login and activate pages without auth
        const isPublicPage =
            pathname.includes("/login") || pathname.includes("/activate") || pathname.includes("/reset-password");

        const stored = getStoredSupplierUser();
        if (!stored && !isPublicPage) {
            router.replace("/supplier-portal/login");
            return;
        }
        setUser(stored);
        setReady(true);
    }, [pathname, router]);

    // Public pages (login, activate) skip the sidebar layout
    const isPublicPage =
        pathname.includes("/login") || pathname.includes("/activate") || pathname.includes("/reset-password");

    if (isPublicPage) {
        return <>{children}</>;
    }

    if (!ready) return null;

    const handleLogout = () => {
        clearSupplierSession();
        router.replace("/supplier-portal/login");
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "flex flex-col border-r border-border bg-card text-foreground transition-all duration-300 relative z-40",
                    collapsed ? "w-[80px]" : "w-[280px]"
                )}
            >
                {/* Header */}
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

                {/* Nav */}
                <TooltipProvider delayDuration={0}>
                    <nav className="flex-1 space-y-1 p-3 overflow-y-auto pt-4">
                        {portalNav.map((item) => {
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
                    </nav>
                </TooltipProvider>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Topbar */}
                <header className="sticky top-0 z-30 flex h-[64px] w-full items-center justify-between border-b border-border bg-card px-[24px]">
                    <div className="flex items-center gap-2 text-[14px]">
                        <span className="text-muted-foreground font-[500]">Supplier Portal</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        <span className="font-[600] text-foreground capitalize">
                            {pathname?.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <ModeToggle />
                        
                        <div className="w-px h-6 bg-border mx-1" />

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-1">
                            {user && (
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-[13px] font-[500] leading-tight text-foreground">
                                        {user.full_name || user.email || "Supplier"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground mt-[2px] leading-tight truncate max-w-[120px]">
                                        {user.supplier_name}
                                    </span>
                                </div>
                            )}
                            <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-[600] text-[13px]">
                                {user?.full_name?.[0] || user?.email?.[0] || "S"}
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 h-[34px] w-[34px] rounded-[8px] bg-secondary hover:bg-muted ml-2">
                                <LogOut className="h-[18px] w-[18px]" />
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* AI Assistant */}
            <AIAssistantElevenLabs 
                isSupplierPortal={true} 
                externalUser={{ fullName: user?.full_name || null, role: "supplier" }} 
            />
        </div>
    );
}
