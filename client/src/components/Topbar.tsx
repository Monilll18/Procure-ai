"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Bell, Search, X, ArrowUpRight, ChevronRight, FileText, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ThemeToggle";
import { usePathname, useRouter } from "next/navigation";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, type Notification } from "@/lib/api";
import { UserButton, useUser, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { useRBAC } from "@/lib/rbac";

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    procurement_officer: "Officer",
    approver: "Finance",
    viewer: "Viewer",
};


export function Topbar() {
    const pathname = usePathname();
    const router = useRouter();
    const pageName = pathname?.split("/").pop()?.replace(/-/g, " ") || "Dashboard";

    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalSpend, setTotalSpend] = useState<number | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const { user } = useUser();
    const { role, can } = useRBAC();
    const canCreateAny = can("create_requisition") || can("create_po") || can("create_supplier");

    useEffect(() => {
        getUnreadNotificationCount()
            .then((data) => setUnreadCount(data.count))
            .catch(() => setUnreadCount(0));

        // Fetch dynamic total spend
        import("@/lib/api").then(({ getPurchaseOrders }) => {
            getPurchaseOrders()
                .then(orders => {
                    const spend = orders.reduce((sum, po) => sum + po.total_amount, 0);
                    setTotalSpend(spend);
                })
                .catch(() => setTotalSpend(0));
        });
    }, []);

    const handleBellClick = async () => {
        if (!notifOpen) {
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch {
                setNotifications([]);
            }
        }
        setNotifOpen(!notifOpen);
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    // Close popover when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        if (notifOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [notifOpen]);

    // Quick search navigation
    const searchRoutes = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Products", path: "/products" },
        { label: "Suppliers", path: "/suppliers" },
        { label: "Inventory", path: "/inventory" },
        { label: "Purchase Orders", path: "/purchase-orders" },
        { label: "Requisitions", path: "/requisitions" },
        { label: "Approvals", path: "/approvals" },
        { label: "Analytics", path: "/analytics" },
        { label: "AI Insights", path: "/ai-insights" },
        { label: "Settings", path: "/settings" },
    ];

    const filteredRoutes = searchQuery
        ? searchRoutes.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    return (
        <header className="sticky top-0 z-30 flex h-[64px] w-full items-center justify-between border-b border-border bg-card px-[24px]">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2 text-[14px]">
                <span className="text-muted-foreground font-[500] cursor-pointer hover:text-foreground transition-colors" onClick={() => router.push('/dashboard')}>Home</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <span className="font-[600] text-foreground capitalize">{pageName}</span>
            </div>

            {/* Right: Search + Actions */}
            <div className="flex items-center gap-3 md:gap-4">
                <div className="relative hidden w-[260px] md:block group">
                    <Search className="absolute left-3 top-2.5 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search pages..."
                        className="pl-10 h-[36px] bg-secondary border border-transparent focus:bg-background focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all duration-150 rounded-[20px] text-[13px] placeholder:text-muted-foreground"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchOpen(true)}
                        onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                    />
                    {searchOpen && filteredRoutes.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-[14px] shadow-lg z-50 overflow-hidden">
                            {filteredRoutes.map((route) => (
                                <button
                                    key={route.path}
                                    className="w-full text-left px-4 py-2.5 text-[13px] text-popover-foreground hover:bg-muted transition-colors flex items-center gap-2"
                                    onMouseDown={() => { router.push(route.path); setSearchQuery(""); }}
                                >
                                    {route.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Balance Chip */}
                    <div className="hidden md:flex items-center bg-secondary rounded-[20px] px-[14px] py-[6px] mr-2" title="Total Procurement Spend">
                        <span className="text-[13px] font-[600] text-foreground mr-2">
                            {totalSpend === null ? (
                                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                            ) : (
                                `$${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            )}
                        </span>
                        <div className="bg-primary/10 rounded-full p-1">
                            <ArrowUpRight className="h-3 w-3 text-primary" />
                        </div>
                    </div>

                    {/* Quick Create Menu */}
                    {canCreateAny && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default" size="icon" className="h-[34px] w-[34px] rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground mr-1">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-[12px]">
                                {can("create_requisition") && (
                                    <DropdownMenuItem onClick={() => router.push('/requisitions/new')} className="gap-2 cursor-pointer py-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>Create Requisition</span>
                                    </DropdownMenuItem>
                                )}
                                {can("create_po") && (
                                    <DropdownMenuItem onClick={() => router.push('/purchase-orders/new')} className="gap-2 cursor-pointer py-2">
                                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                        <span>Create Purchase Order</span>
                                    </DropdownMenuItem>
                                )}
                                {can("create_supplier") && (
                                    <DropdownMenuItem onClick={() => router.push('/suppliers/new')} className="gap-2 cursor-pointer py-2">
                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                        <span>Add New Supplier</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Notification Bell */}
                    <div className="relative" ref={popoverRef}>
                        <Button variant="ghost" size="icon" className="relative h-[34px] w-[34px] rounded-[8px] bg-secondary hover:bg-muted flex items-center justify-center transition-colors" onClick={handleBellClick}>
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-[18px] w-[18px] rounded-full bg-destructive text-[10px] font-[600] text-destructive-foreground flex items-center justify-center ring-2 ring-background">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </Button>

                        {/* Notifications Popover */}
                        {notifOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-[14px] shadow-lg z-50 overflow-hidden">
                                <div className="flex items-center justify-between p-3 border-b border-border">
                                    <h3 className="font-[600] text-[14px] text-popover-foreground">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <Button variant="ghost" size="sm" className="text-[12px] h-7 text-muted-foreground hover:text-foreground" onClick={handleMarkAllRead}>
                                            Mark all read
                                        </Button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-[13px] text-muted-foreground">
                                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.slice(0, 10).map((n) => (
                                            <div
                                                key={n.id}
                                                className={`px-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted cursor-pointer transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                                                onClick={() => { if (n.link) router.push(n.link); setNotifOpen(false); }}
                                            >
                                                <p className="text-[13px] font-[500] text-popover-foreground">{n.title}</p>
                                                <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                    {new Date(n.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 bg-border mx-1" />

                    <ModeToggle />

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-1">
                        <ClerkLoaded>
                            {user && (
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-[13px] font-[500] leading-tight text-foreground">
                                        {user.fullName || user.firstName || "User"}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground mt-[2px] leading-tight capitalize">
                                        {ROLE_LABELS[role] || "Viewer"}
                                    </span>
                                </div>
                            )}
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "h-9 w-9 border border-border rounded-full",
                                    },
                                }}
                            />
                        </ClerkLoaded>
                        <ClerkLoading>
                            <div className="h-9 w-9 rounded-full bg-secondary animate-pulse border border-border" />
                        </ClerkLoading>
                    </div>
                </div>
            </div>
        </header>
    );
}
