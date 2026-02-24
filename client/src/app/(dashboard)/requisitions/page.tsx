"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus, Search, FileText, Loader2, Send, CheckCircle, XCircle,
    ArrowUpRight, Clock, AlertTriangle, Sparkles, ChevronDown, Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useRBAC } from "@/lib/rbac";
import {
    getRequisitions, createRequisition, submitRequisition,
    approveRequisition, rejectRequisition, convertPRtoPO,
    aiParseRequest,
    type PurchaseRequisition, type PRLineItem,
    getProducts, type Product,
    getSuppliers, type Supplier,
} from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Draft", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", icon: FileText },
    submitted: { label: "Submitted", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Send },
    under_review: { label: "Under Review", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock },
    approved: { label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle },
    converted_to_po: { label: "Converted to PO", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: ArrowUpRight },
    cancelled: { label: "Cancelled", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "bg-zinc-500/15 text-zinc-400" },
    medium: { label: "Medium", color: "bg-blue-500/15 text-blue-400" },
    high: { label: "High", color: "bg-amber-500/15 text-amber-400" },
    critical: { label: "Critical", color: "bg-red-500/15 text-red-400" },
};

export default function RequisitionsPage() {
    const { role, can } = useRBAC();
    const [prs, setPrs] = useState<PurchaseRequisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [rejectReason, setRejectReason] = useState("");
    const [showReject, setShowReject] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [nlInput, setNlInput] = useState("");
    const [nlParsing, setNlParsing] = useState(false);
    const [showAIAssist, setShowAIAssist] = useState(false);

    // Create form state
    const [form, setForm] = useState({
        title: "",
        description: "",
        department: "",
        category: "",
        priority: "medium",
        justification: "",
        needed_by: "",
        notes: "",
        line_items: [{ item_name: "", quantity: 1, estimated_unit_price: 0, unit: "pcs", product_id: "" }] as any[],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prData, prodData, suppData] = await Promise.all([
                getRequisitions().catch(() => []),
                getProducts().catch(() => []),
                getSuppliers().catch(() => []),
            ]);
            setPrs(prData);
            setProducts(prodData);
            setSuppliers(suppData);
        } finally {
            setLoading(false);
        }
    };

    const filteredPRs = prs.filter(pr => {
        const matchesSearch = !search || pr.title.toLowerCase().includes(search.toLowerCase()) ||
            pr.pr_number.toLowerCase().includes(search.toLowerCase());
        const matchesTab = tab === "all" ||
            (tab === "pending" && ["submitted", "under_review"].includes(pr.status)) ||
            (tab === "approved" && pr.status === "approved") ||
            (tab === "draft" && pr.status === "draft");
        return matchesSearch && matchesTab;
    });

    const handleCreate = async () => {
        if (!form.title) return;
        setCreating(true);
        try {
            const estimated_total = form.line_items.reduce(
                (sum: number, li: any) => sum + (li.quantity * li.estimated_unit_price), 0
            );
            await createRequisition({
                ...form,
                estimated_total,
                line_items: form.line_items.filter((li: any) => li.item_name),
            });
            setShowCreate(false);
            setForm({
                title: "", description: "", department: "", category: "", priority: "medium",
                justification: "", needed_by: "", notes: "",
                line_items: [{ item_name: "", quantity: 1, estimated_unit_price: 0, unit: "pcs", product_id: "" }],
            });
            await loadData();
        } catch (e: any) {
            alert(e.message || "Failed to create PR");
        } finally {
            setCreating(false);
        }
    };

    const handleAction = async (action: string, prId: string) => {
        setActionLoading(action + prId);
        try {
            if (action === "submit") await submitRequisition(prId);
            else if (action === "approve") await approveRequisition(prId);
            else if (action === "reject") {
                await rejectRequisition(prId, rejectReason);
                setShowReject(false);
                setRejectReason("");
            }
            else if (action === "convert") await convertPRtoPO(prId);
            await loadData();
            setSelectedPR(null);
        } catch (e: any) {
            alert(e.message || `Failed to ${action}`);
        } finally {
            setActionLoading("");
        }
    };

    const addLineItem = () => {
        setForm({
            ...form,
            line_items: [...form.line_items, { item_name: "", quantity: 1, estimated_unit_price: 0, unit: "pcs", product_id: "" }],
        });
    };

    const updateLineItem = (index: number, field: string, value: any) => {
        const items = [...form.line_items];
        items[index] = { ...items[index], [field]: value };
        setForm({ ...form, line_items: items });
    };

    const removeLineItem = (index: number) => {
        setForm({ ...form, line_items: form.line_items.filter((_: any, i: number) => i !== index) });
    };

    const total = form.line_items.reduce(
        (sum: number, li: any) => sum + (li.quantity * li.estimated_unit_price), 0
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-4 text-muted-foreground text-lg">Loading requisitions...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Purchase Requisitions</h1>
                    <p className="text-muted-foreground">Request, review, and convert purchase requisitions</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" /> New Request
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total PRs", value: prs.length, color: "text-foreground" },
                    { label: "Pending Review", value: prs.filter(p => ["submitted", "under_review"].includes(p.status)).length, color: "text-amber-400" },
                    { label: "Approved", value: prs.filter(p => p.status === "approved").length, color: "text-emerald-400" },
                    { label: "Converted to PO", value: prs.filter(p => p.status === "converted_to_po").length, color: "text-purple-400" },
                ].map((stat, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="pt-4 pb-3">
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search PRs..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="draft">Drafts</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* PR Table */}
            <Card className="border-border/50">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PR Number</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Estimated Total</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPRs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No purchase requisitions found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPRs.map(pr => {
                                    const statusCfg = STATUS_CONFIG[pr.status] || STATUS_CONFIG.draft;
                                    const priorityCfg = PRIORITY_CONFIG[pr.priority] || PRIORITY_CONFIG.medium;
                                    return (
                                        <TableRow key={pr.id} className="cursor-pointer hover:bg-muted/30"
                                            onClick={() => setSelectedPR(pr)}>
                                            <TableCell className="font-mono text-sm font-medium">{pr.pr_number}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {pr.title}
                                                    {pr.ai_suggested_supplier && (
                                                        <span title="AI assisted"><Sparkles className="h-3.5 w-3.5 text-purple-400" /></span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-[10px]", priorityCfg.color)}>
                                                    {priorityCfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-[10px]", statusCfg.color)}>
                                                    {statusCfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                ${pr.estimated_total.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {pr.created_at ? new Date(pr.created_at).toLocaleDateString() : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ─── Create PR Dialog ────────────────────────────────────── */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" /> New Purchase Requisition
                        </DialogTitle>
                        <DialogDescription>Create a new purchase request. AI will suggest the best supplier.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Title *</Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Q1 Office Supplies" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Priority</Label>
                                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Department</Label>
                                <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                                    placeholder="e.g. IT, Operations" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Needed By</Label>
                                <Input type="date" value={form.needed_by}
                                    onChange={e => setForm({ ...form, needed_by: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Business Justification</Label>
                            <Textarea value={form.justification}
                                onChange={e => setForm({ ...form, justification: e.target.value })}
                                placeholder="Why is this purchase needed?" rows={2} />
                        </div>

                        <Separator />

                        {/* ─── AI Natural Language Input ─────────────── */}
                        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                            <button
                                type="button"
                                onClick={() => setShowAIAssist(!showAIAssist)}
                                className="flex items-center gap-2 w-full text-left text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors"
                            >
                                <Sparkles className="h-4 w-4" />
                                ✨ Describe what you need (AI auto-fill)
                                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showAIAssist ? "rotate-180" : ""}`} />
                            </button>
                            {showAIAssist && (
                                <div className="mt-3 space-y-3">
                                    <Textarea
                                        value={nlInput}
                                        onChange={(e) => setNlInput(e.target.value)}
                                        placeholder="e.g. I need 50 mechanical keyboards, 20 monitors, and 100 ethernet cables for the new office floor"
                                        rows={3}
                                        className="bg-background"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            disabled={!nlInput.trim() || nlParsing}
                                            onClick={async () => {
                                                setNlParsing(true);
                                                try {
                                                    const result = await aiParseRequest(nlInput);
                                                    const parsed = result.parsed;
                                                    if (parsed && parsed.items && parsed.items.length > 0) {
                                                        const newItems = parsed.items.map((item: any) => ({
                                                            item_name: item.item_name || "",
                                                            quantity: item.quantity || 1,
                                                            estimated_unit_price: item.estimated_unit_price || 0,
                                                            unit: item.unit || "pcs",
                                                            product_id: item.matched_product_id || "",
                                                        }));
                                                        setForm({
                                                            ...form,
                                                            title: form.title || parsed.title || "AI-generated Request",
                                                            category: form.category || parsed.department || "",
                                                            line_items: newItems,
                                                        });
                                                        setShowAIAssist(false);
                                                    }
                                                } catch (e: any) {
                                                    console.error("AI parse failed:", e);
                                                } finally {
                                                    setNlParsing(false);
                                                }
                                            }}
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            {nlParsing ? (
                                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Parsing...</>
                                            ) : (
                                                <><Sparkles className="h-3 w-3 mr-1" /> AI Parse</>
                                            )}
                                        </Button>
                                        <span className="text-xs text-muted-foreground">AI will extract items, quantities, and estimated prices</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Line Items */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-base font-semibold">Line Items</Label>
                                <Button variant="outline" size="sm" onClick={addLineItem}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.line_items.map((li: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-end p-3 rounded-lg border bg-muted/20">
                                        <div className="grid gap-1 flex-1">
                                            <Label className="text-xs">Item Name</Label>
                                            <Input value={li.item_name}
                                                onChange={e => updateLineItem(idx, "item_name", e.target.value)}
                                                placeholder="Item name" />
                                        </div>
                                        <div className="grid gap-1 w-20">
                                            <Label className="text-xs">Qty</Label>
                                            <Input type="number" value={li.quantity}
                                                onChange={e => updateLineItem(idx, "quantity", parseInt(e.target.value) || 1)} />
                                        </div>
                                        <div className="grid gap-1 w-28">
                                            <Label className="text-xs">Unit Price</Label>
                                            <Input type="number" value={li.estimated_unit_price}
                                                onChange={e => updateLineItem(idx, "estimated_unit_price", parseFloat(e.target.value) || 0)} />
                                        </div>
                                        <div className="text-right w-24 pb-1">
                                            <p className="text-sm font-mono font-semibold">
                                                ${(li.quantity * li.estimated_unit_price).toLocaleString()}
                                            </p>
                                        </div>
                                        {form.line_items.length > 1 && (
                                            <Button variant="ghost" size="icon" className="text-red-400"
                                                onClick={() => removeLineItem(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="text-right mt-3">
                                <span className="text-muted-foreground text-sm">Estimated Total: </span>
                                <span className="text-xl font-bold font-mono">${total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating || !form.title}>
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Requisition
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── PR Detail / Action Dialog ──────────────────────────── */}
            <Dialog open={!!selectedPR} onOpenChange={() => setSelectedPR(null)}>
                <DialogContent className="max-w-lg">
                    {selectedPR && (() => {
                        const statusCfg = STATUS_CONFIG[selectedPR.status] || STATUS_CONFIG.draft;
                        const StatusIcon = statusCfg.icon;
                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <StatusIcon className="h-5 w-5" /> {selectedPR.pr_number}
                                    </DialogTitle>
                                    <DialogDescription>{selectedPR.title}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="outline" className={cn("text-xs", statusCfg.color)}>
                                            {statusCfg.label}
                                        </Badge>
                                        <Badge variant="outline" className={cn("text-xs", PRIORITY_CONFIG[selectedPR.priority]?.color)}>
                                            {PRIORITY_CONFIG[selectedPR.priority]?.label || selectedPR.priority}
                                        </Badge>
                                        {selectedPR.ai_suggested_supplier && (
                                            <Badge className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                                <Sparkles className="h-3 w-3 mr-1" /> AI Supplier
                                            </Badge>
                                        )}
                                    </div>

                                    {selectedPR.justification && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Justification</p>
                                            <p className="text-sm">{selectedPR.justification}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Department</p>
                                            <p>{selectedPR.department || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Estimated Total</p>
                                            <p className="font-mono font-bold">${selectedPR.estimated_total.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Needed By</p>
                                            <p>{selectedPR.needed_by || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Created</p>
                                            <p>{selectedPR.created_at ? new Date(selectedPR.created_at).toLocaleDateString() : "—"}</p>
                                        </div>
                                    </div>

                                    {/* Line items */}
                                    {selectedPR.line_items.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Items ({selectedPR.line_items.length})</p>
                                            <div className="space-y-1">
                                                {selectedPR.line_items.map((li, i) => (
                                                    <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                                                        <span>{li.item_name} × {li.quantity}</span>
                                                        <span className="font-mono">${(li.estimated_total || li.quantity * li.estimated_unit_price).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedPR.rejection_reason && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                            <p className="text-xs font-semibold text-red-400 mb-1">Rejection Reason</p>
                                            <p className="text-sm">{selectedPR.rejection_reason}</p>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="flex gap-2">
                                    {selectedPR.status === "draft" && (
                                        <Button onClick={() => handleAction("submit", selectedPR.id)}
                                            disabled={!!actionLoading}>
                                            {actionLoading === "submit" + selectedPR.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Send className="h-4 w-4 mr-1" /> Submit for Approval
                                        </Button>
                                    )}
                                    {["submitted", "under_review"].includes(selectedPR.status) && can("approve_po") && (
                                        <>
                                            <Button variant="destructive"
                                                onClick={() => { setShowReject(true); }}
                                                disabled={!!actionLoading}>
                                                <XCircle className="h-4 w-4 mr-1" /> Reject
                                            </Button>
                                            <Button onClick={() => handleAction("approve", selectedPR.id)}
                                                disabled={!!actionLoading}
                                                className="bg-emerald-600 hover:bg-emerald-700">
                                                {actionLoading === "approve" + selectedPR.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                        </>
                                    )}
                                    {selectedPR.status === "approved" && (
                                        <Button onClick={() => handleAction("convert", selectedPR.id)}
                                            disabled={!!actionLoading}
                                            className="bg-purple-600 hover:bg-purple-700">
                                            {actionLoading === "convert" + selectedPR.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <ArrowUpRight className="h-4 w-4 mr-1" /> Convert to PO
                                        </Button>
                                    )}
                                </DialogFooter>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* ─── Reject Dialog ──────────────────────────────────────── */}
            <Dialog open={showReject} onOpenChange={setShowReject}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Requisition</DialogTitle>
                        <DialogDescription>Provide a reason for rejection.</DialogDescription>
                    </DialogHeader>
                    <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..." rows={3} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
                        <Button variant="destructive"
                            onClick={() => selectedPR && handleAction("reject", selectedPR.id)}
                            disabled={!!actionLoading}>
                            {actionLoading.startsWith("reject") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
