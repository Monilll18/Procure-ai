"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, Plus, Eye, X, Sparkles, Mail, FileText, CheckCircle, AlertTriangle, Copy, ChevronDown, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getPurchaseOrders, createPurchaseOrder, submitPO, getSuppliers, getProducts,
    aiGeneratePO, aiMatchInvoice,
    type PurchaseOrder, type Supplier, type Product, type PODraft, type InvoiceMatch,
} from "@/lib/api";
import { Send } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useAICall } from "@/hooks/useAICall";
import { AIErrorBoundary } from "@/components/AIErrorBoundary";
import { useRBAC } from "@/lib/rbac";

const INVOICE_MAX_CHARS = 15000;

const STATUS_LABELS: Record<string, string> = {
    draft: "Draft", pending_approval: "Pending Approval",
    approved: "Approved", sent: "Sent", received: "Received", cancelled: "Cancelled",
};

export default function PurchaseOrdersPage() {
    const { getToken } = useAuth();
    const { can } = useRBAC();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // AI PO Generation state
    const [poDraft, setPoDraft] = useState<PODraft | null>(null);
    const [poDraftError, setPoDraftError] = useState("");

    // Invoice Matching state
    const [invoiceText, setInvoiceText] = useState("");
    const [invoiceMatch, setInvoiceMatch] = useState<InvoiceMatch | null>(null);
    const [invoiceMatchError, setInvoiceMatchError] = useState("");

    // Create PO form state
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [poNotes, setPoNotes] = useState("");
    const [lineItems, setLineItems] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([]);

    const loadOrders = () => {
        setLoading(true);
        getPurchaseOrders()
            .then(setOrders)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadOrders(); }, []);

    const handleViewOrder = (po: PurchaseOrder) => {
        setViewOrder(po);
        setPoDraft(null);
        setPoDraftError("");
        setInvoiceText("");
        setInvoiceMatch(null);
        setInvoiceMatchError("");
    };

    // ── AI PO Draft — useAICall (debounce + cooldown + abort)
    const poDraftAI = useAICall<{ draft: PODraft }>({
        fn: useCallback((_signal: AbortSignal) => {
            if (!viewOrder) return Promise.reject(new Error("No PO selected"));
            const lineItemsForAI = (viewOrder.line_items || []).map((li) => ({
                product_name: li.product_id,
                quantity: li.quantity,
                unit: "pcs",
                unit_price: li.unit_price,
                total_price: li.total_price,
            }));
            return aiGeneratePO({
                po_number: viewOrder.po_number,
                total_amount: viewOrder.total_amount,
                supplier_id: viewOrder.supplier_id,
                line_items: lineItemsForAI,
                payment_terms: "Net 30",
                purpose: viewOrder.notes || "General procurement",
            });
        }, [viewOrder]),
        onSuccess: (result) => {
            if (result.draft) {
                const draft = typeof result.draft === "string" ? JSON.parse(result.draft) : result.draft;
                setPoDraft(draft);
            }
            setPoDraftError("");
        },
        onError: (msg) => setPoDraftError(msg || "Failed to generate PO draft"),
    });

    // ── Invoice Match — useAICall (debounce + cooldown + abort)
    const invoiceMatchAI = useAICall<{ match: InvoiceMatch }>({
        fn: useCallback((_signal: AbortSignal) => {
            if (!viewOrder || !invoiceText.trim()) return Promise.reject(new Error("Invoice text required"));
            return aiMatchInvoice({ invoice_text: invoiceText, po_id: viewOrder.id });
        }, [viewOrder, invoiceText]),
        onSuccess: (result) => {
            if (result.match) {
                const match = typeof result.match === "string" ? JSON.parse(result.match) : result.match;
                setInvoiceMatch(match);
            }
            setInvoiceMatchError("");
        },
        onError: (msg) => setInvoiceMatchError(msg || "Invoice matching failed"),
    });


    const openCreate = async () => {
        const [s, p] = await Promise.all([getSuppliers(), getProducts()]);
        setSuppliers(s);
        setProducts(p);
        setSelectedSupplier("");
        setPoNotes("");
        setLineItems([{ product_id: "", quantity: 1, unit_price: 0 }]);
        setCreateOpen(true);
    };

    const addLineItem = () => {
        setLineItems([...lineItems, { product_id: "", quantity: 1, unit_price: 0 }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: string, value: any) => {
        const updated = [...lineItems];
        (updated[index] as any)[field] = value;
        setLineItems(updated);
    };

    const totalAmount = lineItems.reduce((sum, li) => sum + (li.quantity * li.unit_price), 0);

    const handleCreatePO = async () => {
        if (!selectedSupplier || lineItems.length === 0) return;
        setSaving(true);
        try {
            const token = await getToken() || "";
            await createPurchaseOrder({
                supplier_id: selectedSupplier,
                notes: poNotes || null,
                line_items: lineItems.map((li) => ({
                    product_id: li.product_id,
                    quantity: li.quantity,
                    unit_price: li.unit_price,
                    total_price: li.quantity * li.unit_price,
                })),
            }, token);
            setCreateOpen(false);
            loadOrders();
        } catch (err: any) {
            alert(err.message || "Failed to create PO");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitPO = async (poId: string) => {
        setSubmitting(true);
        try {
            const token = await getToken() || "";
            await submitPO(poId, token);
            setViewOrder(null);
            loadOrders();
        } catch (err: any) {
            alert(err.message || "Failed to submit PO for approval");
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = orders.filter(
        (po) =>
            po.po_number.toLowerCase().includes(search.toLowerCase()) ||
            (po.supplier_name && po.supplier_name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
                    <p className="text-muted-foreground">
                        Track and manage orders sent to suppliers.{" "}
                        <span className="text-xs">({orders.length} total)</span>
                    </p>
                </div>
                {can("create_po") && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
                    </Button>
                )}
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
                    <TabsTrigger value="draft">Drafts ({orders.filter(o => o.status === "draft").length})</TabsTrigger>
                    <TabsTrigger value="active">Active ({orders.filter(o => ["pending_approval", "approved", "sent"].includes(o.status)).length})</TabsTrigger>
                    <TabsTrigger value="closed">Received ({orders.filter(o => o.status === "received").length})</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search PO number or supplier..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="all"><OrderTable orders={filtered} loading={loading} search={search} onView={handleViewOrder} /></TabsContent>
                <TabsContent value="draft"><OrderTable orders={filtered.filter(o => o.status === "draft")} loading={loading} search={search} onView={handleViewOrder} /></TabsContent>
                <TabsContent value="active"><OrderTable orders={filtered.filter(o => ["pending_approval", "approved", "sent"].includes(o.status))} loading={loading} search={search} onView={handleViewOrder} /></TabsContent>
                <TabsContent value="closed"><OrderTable orders={filtered.filter(o => o.status === "received")} loading={loading} search={search} onView={handleViewOrder} /></TabsContent>
            </Tabs>

            {/* Create PO Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Purchase Order</DialogTitle>
                        <DialogDescription>Select a supplier and add products to create a new PO.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid gap-2">
                            <Label>Supplier</Label>
                            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} {s.rating && `(★${s.rating})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Line Items</Label>
                                <Button variant="outline" size="sm" onClick={addLineItem}>
                                    <Plus className="mr-1 h-3 w-3" /> Add Item
                                </Button>
                            </div>
                            {lineItems.map((li, i) => (
                                <div key={i} className="flex items-end gap-2 p-3 rounded-lg border bg-muted/30">
                                    <div className="flex-1 grid gap-1">
                                        <Label className="text-xs">Product</Label>
                                        <Select value={li.product_id} onValueChange={(v) => updateLineItem(i, "product_id", v)}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select product..." /></SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24 grid gap-1">
                                        <Label className="text-xs">Qty</Label>
                                        <Input type="number" className="h-9" min={1} value={li.quantity}
                                            onChange={(e) => updateLineItem(i, "quantity", parseInt(e.target.value) || 1)} />
                                    </div>
                                    <div className="w-28 grid gap-1">
                                        <Label className="text-xs">Unit Price ($)</Label>
                                        <Input type="number" className="h-9" min={0} step={0.01} value={li.unit_price}
                                            onChange={(e) => updateLineItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="w-24 text-right">
                                        <p className="text-sm font-medium">${(li.quantity * li.unit_price).toFixed(2)}</p>
                                    </div>
                                    {lineItems.length > 1 && (
                                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeLineItem(i)}>
                                            <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <div className="flex justify-end p-2">
                                <p className="text-lg font-bold">Total: ${totalAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Notes (optional)</Label>
                            <Textarea placeholder="Add any special instructions..." value={poNotes} onChange={(e) => setPoNotes(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreatePO} disabled={saving || !selectedSupplier || lineItems.some(li => !li.product_id)}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create PO (${totalAmount.toFixed(2)})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View PO Detail Dialog — with AI tabs */}
            <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
                <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>PO: {viewOrder?.po_number}</DialogTitle>
                        <DialogDescription>
                            Created on {viewOrder?.created_at ? new Date(viewOrder.created_at).toLocaleDateString() : "N/A"}
                        </DialogDescription>
                    </DialogHeader>
                    {viewOrder && (
                        <Tabs defaultValue="details">
                            <TabsList className="w-full">
                                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                                <TabsTrigger value="ai-draft" className="flex-1">
                                    <Sparkles className="h-3.5 w-3.5 mr-1" /> AI Draft
                                </TabsTrigger>
                                <TabsTrigger value="invoice" className="flex-1">
                                    <FileText className="h-3.5 w-3.5 mr-1" /> Invoice Match
                                </TabsTrigger>
                            </TabsList>

                            {/* Details Tab */}
                            <TabsContent value="details" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Supplier</p>
                                        <p className="font-medium">{viewOrder.supplier_name || "Unknown"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <StatusBadge status={viewOrder.status} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Amount</p>
                                        <p className="text-lg font-bold">${viewOrder.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Expected Delivery</p>
                                        <p className="font-medium">{viewOrder.expected_delivery || "Not set"}</p>
                                    </div>
                                </div>
                                {viewOrder.notes && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Notes</p>
                                        <p className="text-sm">{viewOrder.notes}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2">Line Items ({viewOrder.line_items?.length || 0})</p>
                                    <div className="rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(viewOrder.line_items || []).map((li, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium">{li.product_id.substring(0, 8)}...</TableCell>
                                                        <TableCell>{li.quantity}</TableCell>
                                                        <TableCell>${li.unit_price.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">${li.total_price.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Submit for Approval button — only for draft POs */}
                                {viewOrder.status === "draft" && can("create_po") && (
                                    <div className="pt-3 border-t">
                                        <Button
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                            onClick={() => handleSubmitPO(viewOrder.id)}
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                                            ) : (
                                                <><Send className="mr-2 h-4 w-4" /> Submit for Approval</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            {/* AI Draft Tab */}
                            <TabsContent value="ai-draft" className="pt-4 space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    <Sparkles className="h-4 w-4 inline mr-2 text-purple-500" />
                                    AI will generate a professional PO email and document ready to send to <strong>{viewOrder.supplier_name}</strong>.
                                </div>
                                <Button
                                    onClick={poDraftAI.trigger}
                                    disabled={poDraftAI.loading || poDraftAI.cooldown > 0}
                                    className="w-full"
                                >
                                    {poDraftAI.loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Draft...</>
                                    ) : poDraftAI.cooldown > 0 ? (
                                        <><Clock className="mr-2 h-4 w-4" /> Wait {poDraftAI.cooldown}s...</>
                                    ) : (
                                        <><Sparkles className="mr-2 h-4 w-4" /> Generate AI PO Draft</>
                                    )}
                                </Button>

                                {poDraftError && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        {poDraftError}
                                    </div>
                                )}

                                {poDraft && (
                                    <AIErrorBoundary featureName="PO Draft">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-blue-500" /> Email Draft
                                                    </p>
                                                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(poDraft.email_body)}>
                                                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                                                    </Button>
                                                </div>
                                                <div className="p-3 rounded-lg border bg-card text-sm">
                                                    <p className="font-medium text-xs text-muted-foreground mb-1">Subject: {poDraft.email_subject}</p>
                                                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed max-h-48 overflow-y-auto">{poDraft.email_body}</pre>
                                                </div>
                                            </div>

                                            {poDraft.special_notes?.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-amber-600">⚠️ Special Notes</p>
                                                    {poDraft.special_notes.map((note, i) => (
                                                        <p key={i} className="text-xs text-muted-foreground">• {note}</p>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-green-500" /> PO Document
                                                    </p>
                                                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(poDraft.po_document)}>
                                                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                                                    </Button>
                                                </div>
                                                <pre className="p-3 rounded-lg border bg-muted text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{poDraft.po_document}</pre>
                                            </div>
                                        </div>
                                    </AIErrorBoundary>
                                )}
                            </TabsContent>

                            {/* Invoice Match Tab */}
                            <TabsContent value="invoice" className="pt-4 space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    <FileText className="h-4 w-4 inline mr-2 text-green-500" />
                                    Paste the invoice text (from OCR or copy-paste) to perform 3-way matching against this PO.
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Invoice Text (paste OCR output or invoice content)</Label>
                                        <span className={`text-xs ${invoiceText.length > INVOICE_MAX_CHARS
                                            ? "text-red-500 font-semibold"
                                            : "text-muted-foreground"
                                            }`}>
                                            {invoiceText.length.toLocaleString()} / {INVOICE_MAX_CHARS.toLocaleString()}
                                        </span>
                                    </div>
                                    <Textarea
                                        placeholder={`Invoice #INV-2024-001\nDate: January 15, 2024\nFrom: ${viewOrder.supplier_name || "Supplier Name"}\n\nItem 1: Product A x 10 @ $25.00 = $250.00\nItem 2: Product B x 5 @ $40.00 = $200.00\n\nTotal: $450.00\nPayment Terms: Net 30`}
                                        value={invoiceText}
                                        onChange={(e) => setInvoiceText(e.target.value.slice(0, INVOICE_MAX_CHARS))}
                                        rows={6}
                                        className={`font-mono text-xs ${invoiceText.length > INVOICE_MAX_CHARS * 0.9 ? "border-amber-400" : ""
                                            }`}
                                    />
                                </div>

                                <Button
                                    onClick={invoiceMatchAI.trigger}
                                    disabled={invoiceMatchAI.loading || invoiceMatchAI.cooldown > 0 || !invoiceText.trim() || invoiceText.length > INVOICE_MAX_CHARS}
                                    className="w-full"
                                >
                                    {invoiceMatchAI.loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Matching Invoice...</>
                                    ) : invoiceMatchAI.cooldown > 0 ? (
                                        <><Clock className="mr-2 h-4 w-4" /> Wait {invoiceMatchAI.cooldown}s...</>
                                    ) : (
                                        <><Sparkles className="mr-2 h-4 w-4" /> Run 3-Way Match</>
                                    )}
                                </Button>

                                {invoiceMatchError && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        {invoiceMatchError}
                                    </div>
                                )}

                                {invoiceMatch && (
                                    <AIErrorBoundary featureName="Invoice Match">
                                        <div className="space-y-4">
                                            {/* Match Result Banner */}
                                            <div className={`flex items-center gap-3 p-4 rounded-lg border ${invoiceMatch.match_result === "approved" ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700" :
                                                invoiceMatch.match_result === "discrepancy" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700" :
                                                    "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
                                                }`}>
                                                {invoiceMatch.match_result === "approved" ? (
                                                    <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                                                ) : (
                                                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-semibold capitalize">{invoiceMatch.match_result.replace("_", " ")}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Match score: {Math.round(invoiceMatch.match_score * 100)}% · {invoiceMatch.action_reason}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className={`${invoiceMatch.recommended_action === "approve_for_payment" ? "border-green-300 text-green-700" :
                                                    "border-amber-300 text-amber-700"
                                                    }`}>
                                                    {invoiceMatch.recommended_action.replace(/_/g, " ")}
                                                </Badge>
                                            </div>

                                            {/* Discrepancies */}
                                            {invoiceMatch.discrepancies?.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-red-600">
                                                        ⚠️ {invoiceMatch.discrepancies.length} Discrepanc{invoiceMatch.discrepancies.length === 1 ? "y" : "ies"} Found
                                                        {invoiceMatch.total_dispute_amount > 0 && (
                                                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                                (${invoiceMatch.total_dispute_amount.toFixed(2)} in dispute)
                                                            </span>
                                                        )}
                                                    </p>
                                                    {invoiceMatch.discrepancies.map((d, i) => (
                                                        <div key={i} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 text-sm">
                                                            <p className="font-medium">{d.description}</p>
                                                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                                                <span>PO: <strong>{d.po_value}</strong></span>
                                                                <span>Invoice: <strong>{d.invoice_value}</strong></span>
                                                                {d.financial_impact > 0 && <span className="text-red-600">Impact: ${d.financial_impact.toFixed(2)}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Extracted Invoice Data */}
                                            {invoiceMatch.invoice_extracted && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold">Extracted Invoice Data</p>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {invoiceMatch.invoice_extracted.invoice_number && (
                                                            <div className="p-2 rounded bg-muted">
                                                                <p className="text-muted-foreground">Invoice #</p>
                                                                <p className="font-medium">{invoiceMatch.invoice_extracted.invoice_number}</p>
                                                            </div>
                                                        )}
                                                        {invoiceMatch.invoice_extracted.total_amount != null && (
                                                            <div className="p-2 rounded bg-muted">
                                                                <p className="text-muted-foreground">Invoice Total</p>
                                                                <p className="font-medium">${invoiceMatch.invoice_extracted.total_amount?.toLocaleString()}</p>
                                                            </div>
                                                        )}
                                                        {invoiceMatch.invoice_extracted.due_date && (
                                                            <div className="p-2 rounded bg-muted">
                                                                <p className="text-muted-foreground">Due Date</p>
                                                                <p className="font-medium">{invoiceMatch.invoice_extracted.due_date}</p>
                                                            </div>
                                                        )}
                                                        {invoiceMatch.invoice_extracted.payment_terms && (
                                                            <div className="p-2 rounded bg-muted">
                                                                <p className="text-muted-foreground">Payment Terms</p>
                                                                <p className="font-medium">{invoiceMatch.invoice_extracted.payment_terms}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </AIErrorBoundary>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function OrderTable({ orders, loading, search, onView }: { orders: PurchaseOrder[]; loading: boolean; search: string; onView: (po: PurchaseOrder) => void }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading orders...</span>
            </div>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                    {search ? "No orders match your search." : "No orders found. Click 'Create Purchase Order' to get started."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((po) => (
                                <TableRow key={po.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onView(po)}>
                                    <TableCell className="font-medium text-primary">{po.po_number}</TableCell>
                                    <TableCell>{po.supplier_name || "Unknown"}</TableCell>
                                    <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{po.line_items?.length || 0}</TableCell>
                                    <TableCell className="font-medium">
                                        ${po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell><StatusBadge status={po.status} /></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onView(po); }}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        pending_approval: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        sent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
        received: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
        <Badge variant="outline" className={`border-0 ${styles[status] || "bg-gray-100"}`}>
            {STATUS_LABELS[status] || status}
        </Badge>
    );
}
