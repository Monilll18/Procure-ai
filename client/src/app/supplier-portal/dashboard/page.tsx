"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ShoppingCart, DollarSign, Clock, CheckCircle, TrendingUp, Package,
    Loader2, RefreshCw, Truck,
} from "lucide-react";
import Link from "next/link";
import {
    getSupplierDashboard, getSupplierPOs,
    type DashboardData, type SupplierPO,
} from "@/lib/supplier-api";

const STATUS_COLORS: Record<string, string> = {
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    partially_received: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    pending_approval: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function SupplierDashboardPage() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [recentPOs, setRecentPOs] = useState<SupplierPO[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [d, pos] = await Promise.all([
                getSupplierDashboard(),
                getSupplierPOs(),
            ]);
            setDashboard(d);
            setRecentPOs(pos.slice(0, 5));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading || !dashboard) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const stats = dashboard.stats;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Welcome, {dashboard.user.full_name || "Supplier"}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {dashboard.supplier.name} — Supplier Dashboard
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-violet-200/50 dark:border-violet-800/30">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">New POs</p>
                                <p className="text-2xl font-bold text-violet-600">{stats.new_pos}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-violet-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Value</p>
                                <p className="text-2xl font-bold">${stats.total_value.toLocaleString()}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shipment Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-blue-200/50 dark:border-blue-800/30">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Shipments</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.active_shipments}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Shipments</p>
                                <p className="text-2xl font-bold">{stats.total_shipments}</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent POs */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Recent Purchase Orders</CardTitle>
                    <Link href="/supplier-portal/purchase-orders">
                        <Button variant="ghost" size="sm" className="text-violet-600">
                            View All →
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentPOs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p>No purchase orders yet</p>
                            <p className="text-sm mt-1">Orders from your buyers will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentPOs.map((po) => (
                                <Link
                                    key={po.id}
                                    href={`/supplier-portal/purchase-orders`}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <p className="font-semibold text-sm">{po.po_number}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {po.line_items.length} items • Created{" "}
                                            {po.created_at ? new Date(po.created_at).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-sm">
                                            ${po.total_amount.toLocaleString()}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={`border-0 text-xs capitalize ${STATUS_COLORS[po.status] || ""}`}
                                        >
                                            {po.status.replace(/_/g, " ")}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
