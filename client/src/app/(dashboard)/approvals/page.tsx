"use client";

import { useState } from "react";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Clock, Loader2, FileText, ShoppingCart, ArrowUpRight } from "lucide-react";
import { DoubleConfirmButton, MorphingSubmitButton } from "@/components/ui/animated-buttons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getPurchaseOrders, PurchaseOrder, approvePO, rejectPO,
    getRequisitions, approveRequisition, rejectRequisition,
    type PurchaseRequisition,
} from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useRBAC } from "@/lib/rbac";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/skeletons";

export default function ApprovalsPage() {
    const { getToken } = useAuth();
    const { can } = useRBAC();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const { data: allPOs, refresh: refreshPOs } = useCachedFetch<PurchaseOrder[]>({
        cacheKey: "/api/purchase-orders/?status=pending_approval",
        fetcher: () => getPurchaseOrders("pending_approval"),
    });
    const { data: allPRs, loading, refresh: refreshPRs } = useCachedFetch<PurchaseRequisition[]>({
        cacheKey: "/api/requisitions/",
        fetcher: getRequisitions,
    });

    const pendingPOs: PurchaseOrder[] = allPOs ?? [];
    const pendingPRs: PurchaseRequisition[] = (allPRs ?? []).filter(
        (pr) => pr.status === "submitted" || pr.status === "under_review"
    );

    const loadData = () => { refreshPOs(); refreshPRs(); };

    const handleApprovePO = async (poId: string) => {
        try {
            setActionLoading(poId);
            const token = await getToken();
            await approvePO(poId, token || "");
            loadData();
            toast.success("Purchase order approved");
        } catch (error: any) {
            console.error("Failed to approve:", error);
            toast.error(error.message || "Failed to approve PO");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectPO = async (poId: string) => {
        try {
            setActionLoading(poId);
            const token = await getToken();
            await rejectPO(poId, token || "");
            loadData();
            toast.success("Purchase order rejected");
        } catch (error: any) {
            console.error("Failed to reject:", error);
            toast.error(error.message || "Failed to reject PO");
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprovePR = async (prId: string) => {
        try {
            setActionLoading(prId);
            const token = await getToken();
            await approveRequisition(prId, token);
            loadData();
            toast.success("Requisition approved");
        } catch (error: any) {
            console.error("Failed to approve PR:", error);
            toast.error(error.message || "Failed to approve");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectPR = async (prId: string) => {
        try {
            setActionLoading(prId);
            const token = await getToken();
            await rejectRequisition(prId, "Rejected from approvals page", token);
            loadData();
            toast.success("Requisition rejected");
        } catch (error: any) {
            console.error("Failed to reject PR:", error);
            toast.error(error.message || "Failed to reject");
        } finally {
            setActionLoading(null);
        }
    };

    const totalPending = pendingPRs.length + pendingPOs.length;

    if (loading) {
        return <PageSkeleton rows={4} cols={4} />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
                <div className="text-muted-foreground">
                    Review and approve purchase requisitions and orders.
                    {totalPending > 0 && (
                        <Badge variant="destructive" className="ml-2 align-middle">
                            {totalPending} pending
                        </Badge>
                    )}
                </div>
            </div>

            {totalPending === 0 ? (
                <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <Check className="h-12 w-12 text-green-500" />
                        <h3 className="text-xl font-semibold">All caught up!</h3>
                        <p className="text-muted-foreground">No items pending approval.</p>
                    </div>
                </Card>
            ) : (
                <Tabs defaultValue={pendingPRs.length > 0 ? "prs" : "pos"} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="prs" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Requisitions
                            {pendingPRs.length > 0 && (
                                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">
                                    {pendingPRs.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="pos" className="gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Purchase Orders
                            {pendingPOs.length > 0 && (
                                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">
                                    {pendingPOs.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ─── Submitted PRs ─── */}
                    <TabsContent value="prs">
                        {pendingPRs.length === 0 ? (
                            <Card className="p-6 text-center text-muted-foreground">
                                No requisitions awaiting approval.
                            </Card>
                        ) : (
                            <div className="grid gap-6 lg:grid-cols-2">
                                {pendingPRs.map((pr) => (
                                    <Card key={pr.id} className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <Avatar>
                                                        <AvatarFallback className="bg-amber-100 text-amber-700">
                                                            <FileText className="w-4 h-4" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-base">{pr.pr_number}</CardTitle>
                                                        <CardDescription>{pr.title}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                                    <Clock className="w-3 h-3 mr-1" /> Submitted
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3">
                                            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Department: {pr.department || "—"}</span>
                                                    <span>Priority: <span className="font-medium capitalize">{pr.priority}</span></span>
                                                </div>
                                                {pr.justification && (
                                                    <p className="text-sm italic text-muted-foreground">"{pr.justification}"</p>
                                                )}
                                                {pr.line_items?.slice(0, 3).map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span>{item.quantity} × {item.item_name}</span>
                                                        <span>${(item.quantity * item.estimated_unit_price).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                <div className="border-t pt-2 flex justify-between font-bold text-base mt-2">
                                                    <span>Estimated Total</span>
                                                    <span>${pr.estimated_total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex gap-3 border-t bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                            {can("approve_pr") ? (
                                                <>
                                                    <DoubleConfirmButton
                                                        idleText="Reject"
                                                        idleIcon={X}
                                                        idleClasses="bg-white text-black hover:bg-zinc-100 border border-zinc-200 dark:bg-[#252837] dark:text-[#d1d5db] dark:border-[#2e3347] flex-1 w-full"
                                                        confirmClasses="bg-red-500/10 text-red-500 border border-red-500/50 flex-1 w-full"
                                                        successClasses="bg-red-500 text-white flex-1 w-full"
                                                        onConfirm={() => handleRejectPR(pr.id)}
                                                    />
                                                    <MorphingSubmitButton
                                                        idleText="Approve"
                                                        idleIcon={Check}
                                                        variant="success"
                                                        className="flex-1 w-full"
                                                        onAction={() => handleApprovePR(pr.id)}
                                                    />
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground w-full text-center">
                                                    You do not have permission to approve requisitions.
                                                </p>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ─── Pending PO Approvals ─── */}
                    <TabsContent value="pos">
                        {pendingPOs.length === 0 ? (
                            <Card className="p-6 text-center text-muted-foreground">
                                No purchase orders pending approval.
                            </Card>
                        ) : (
                            <div className="grid gap-6 lg:grid-cols-2">
                                {pendingPOs.map((po) => (
                                    <Card key={po.id} className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <Avatar>
                                                        <AvatarFallback className="bg-purple-100 text-purple-700">
                                                            {po.po_number?.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-base">{po.po_number}</CardTitle>
                                                        <CardDescription>
                                                            {po.supplier_name || "Unknown Supplier"} • {po.line_items?.length || 0} items
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                                    <Clock className="w-3 h-3 mr-1" /> Pending
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3">
                                            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Created: {new Date(po.created_at).toLocaleDateString()}</span>
                                                    {po.expected_delivery && (
                                                        <span>Due: {new Date(po.expected_delivery).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                                {po.line_items?.slice(0, 3).map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span>{item.quantity} × item</span>
                                                        <span>${item.total_price?.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                <div className="border-t pt-2 flex justify-between font-bold text-base mt-2">
                                                    <span>Total</span>
                                                    <span>${po.total_amount?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            {po.notes && (
                                                <p className="text-xs text-muted-foreground mt-2 italic">Note: {po.notes}</p>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex gap-3 border-t bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                            {can("approve_po") ? (
                                                <>
                                                    <DoubleConfirmButton
                                                        idleText="Reject"
                                                        idleIcon={X}
                                                        idleClasses="bg-white text-black hover:bg-zinc-100 border border-zinc-200 dark:bg-[#252837] dark:text-[#d1d5db] dark:border-[#2e3347] flex-1 w-full"
                                                        confirmClasses="bg-red-500/10 text-red-500 border border-red-500/50 flex-1 w-full"
                                                        successClasses="bg-red-500 text-white flex-1 w-full"
                                                        onConfirm={() => handleRejectPO(po.id)}
                                                    />
                                                    <MorphingSubmitButton
                                                        idleText="Approve"
                                                        idleIcon={Check}
                                                        variant="purple"
                                                        className="flex-1 w-full"
                                                        onAction={() => handleApprovePO(po.id)}
                                                    />
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground w-full text-center">
                                                    You do not have permission to approve orders.
                                                </p>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
