"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Truck, Package, Loader2, RefreshCw, Plus, MapPin,
    Clock, CheckCircle, AlertTriangle, ArrowRight, Eye,
} from "lucide-react";
import {
    getShipments, createShipment, updateShipment, getSupplierPOs,
    type SupplierShipment, type SupplierPO,
} from "@/lib/supplier-api";

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
    preparing: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    dispatched: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    in_transit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TIMELINE_STEPS = ["dispatched", "in_transit", "delivered"];

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<SupplierShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    // Create shipment dialog
    const [showCreate, setShowCreate] = useState(false);
    const [availablePOs, setAvailablePOs] = useState<SupplierPO[]>([]);
    const [selectedPO, setSelectedPO] = useState<SupplierPO | null>(null);
    const [carrier, setCarrier] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [estimatedDelivery, setEstimatedDelivery] = useState("");
    const [shipNotes, setShipNotes] = useState("");
    const [shipItems, setShipItems] = useState<Record<string, number>>({});
    const [creating, setCreating] = useState(false);

    // Update dialog
    const [updateTarget, setUpdateTarget] = useState<SupplierShipment | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [updateTracking, setUpdateTracking] = useState("");
    const [updateNotes, setUpdateNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    // Detail dialog
    const [viewShipment, setViewShipment] = useState<SupplierShipment | null>(null);

    const loadShipments = async () => {
        setLoading(true);
        try {
            const data = await getShipments(filter || undefined);
            setShipments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadShipments(); }, [filter]);

    const openCreateDialog = async () => {
        try {
            const pos = await getSupplierPOs("approved");
            setAvailablePOs(pos);
            setShowCreate(true);
        } catch (err) {
            console.error(err);
        }
    };

    const selectPOForShipment = (po: SupplierPO) => {
        setSelectedPO(po);
        const items: Record<string, number> = {};
        po.line_items.forEach((li) => {
            items[li.id] = li.quantity - li.quantity_received;
        });
        setShipItems(items);
    };

    const handleCreateShipment = async () => {
        if (!selectedPO) return;
        setCreating(true);
        try {
            const items = selectedPO.line_items.map((li) => ({
                line_item_id: li.id,
                quantity_shipped: shipItems[li.id] ?? li.quantity,
            }));

            const isPartial = selectedPO.line_items.some(
                (li) => (shipItems[li.id] ?? li.quantity) < li.quantity
            );

            await createShipment({
                po_id: selectedPO.id,
                shipment_type: isPartial ? "partial" : "full",
                carrier: carrier || undefined,
                tracking_number: trackingNumber || undefined,
                estimated_delivery: estimatedDelivery || undefined,
                notes: shipNotes || undefined,
                items,
            });

            setShowCreate(false);
            setSelectedPO(null);
            setCarrier("");
            setTrackingNumber("");
            setEstimatedDelivery("");
            setShipNotes("");
            loadShipments();
        } catch (err: any) {
            alert(`❌ ${err.message}`);
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateShipment = async () => {
        if (!updateTarget) return;
        setUpdating(true);
        try {
            await updateShipment(updateTarget.id, {
                status: newStatus,
                tracking_number: updateTracking || undefined,
                notes: updateNotes || undefined,
            });
            setUpdateTarget(null);
            loadShipments();
        } catch (err: any) {
            alert(`❌ ${err.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStep = (status: string) => TIMELINE_STEPS.indexOf(status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="h-6 w-6 text-violet-500" /> Shipments
                    </h1>
                    <p className="text-muted-foreground text-sm">Track and manage your dispatched goods</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="dispatched">Dispatched</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadShipments}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={openCreateDialog} className="bg-violet-600 hover:bg-violet-700 gap-1">
                        <Plus className="h-4 w-4" /> New Shipment
                    </Button>
                </div>
            </div>

            {/* Shipment List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
            ) : shipments.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                        <p className="font-semibold">No shipments yet</p>
                        <p className="text-sm mt-1">Create a shipment after accepting a purchase order</p>
                        <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                            <Plus className="h-4 w-4 mr-2" /> Create First Shipment
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {shipments.map((s) => (
                        <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-base">{s.shipment_number}</h3>
                                            <Badge variant="outline" className={`border-0 text-xs capitalize ${SHIPMENT_STATUS_COLORS[s.status] || ""}`}>
                                                {s.status.replace(/_/g, " ")}
                                            </Badge>
                                            {s.shipment_type === "partial" && (
                                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">Partial</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            PO: <span className="font-medium text-foreground">{s.po_number}</span>
                                            {s.carrier && ` • ${s.carrier}`}
                                            {s.tracking_number && ` • #${s.tracking_number}`}
                                        </p>

                                        {/* Progress Timeline */}
                                        <div className="flex items-center gap-1 mt-3">
                                            {TIMELINE_STEPS.map((step, idx) => {
                                                const currentStep = getStatusStep(s.status);
                                                const isCompleted = idx <= currentStep;
                                                return (
                                                    <div key={step} className="flex items-center gap-1">
                                                        <div className={`h-2 w-2 rounded-full ${isCompleted ? "bg-violet-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                                                        <span className={`text-xs ${isCompleted ? "text-violet-600 font-medium" : "text-muted-foreground"}`}>
                                                            {step.replace(/_/g, " ")}
                                                        </span>
                                                        {idx < TIMELINE_STEPS.length - 1 && (
                                                            <ArrowRight className={`h-3 w-3 mx-1 ${isCompleted ? "text-violet-400" : "text-gray-300"}`} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Items chips */}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {s.items.slice(0, 3).map((si) => (
                                                <span key={si.id} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                                    {si.product_name} × {si.quantity_shipped}
                                                </span>
                                            ))}
                                            {s.items.length > 3 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +{s.items.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        <Button size="sm" variant="outline" onClick={() => setViewShipment(s)}>
                                            <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                                        </Button>
                                        {s.status === "dispatched" && (
                                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => {
                                                setUpdateTarget(s);
                                                setNewStatus("in_transit");
                                                setUpdateTracking(s.tracking_number || "");
                                            }}>
                                                <MapPin className="h-3.5 w-3.5 mr-1" /> In Transit
                                            </Button>
                                        )}
                                        {s.status === "in_transit" && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                                                setUpdateTarget(s);
                                                setNewStatus("delivered");
                                            }}>
                                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Delivered
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!viewShipment} onOpenChange={() => setViewShipment(null)}>
                <DialogContent className="max-w-2xl">
                    {viewShipment && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {viewShipment.shipment_number}
                                    <Badge variant="outline" className={`border-0 text-xs capitalize ${SHIPMENT_STATUS_COLORS[viewShipment.status] || ""}`}>
                                        {viewShipment.status.replace(/_/g, " ")}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    PO: {viewShipment.po_number}
                                    {viewShipment.carrier && ` • Carrier: ${viewShipment.carrier}`}
                                    {viewShipment.tracking_number && ` • Tracking: ${viewShipment.tracking_number}`}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Timeline Info */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center p-3 rounded-lg border">
                                        <Truck className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                        <p className="text-xs text-muted-foreground">Dispatched</p>
                                        <p className="text-sm font-medium">
                                            {viewShipment.dispatched_at ? new Date(viewShipment.dispatched_at).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg border">
                                        <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                                        <p className="text-xs text-muted-foreground">Est. Delivery</p>
                                        <p className="text-sm font-medium">{viewShipment.estimated_delivery || "—"}</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg border">
                                        <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                                        <p className="text-xs text-muted-foreground">Delivered</p>
                                        <p className="text-sm font-medium">{viewShipment.actual_delivery || "—"}</p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-center">Shipped</TableHead>
                                                <TableHead className="text-center">Ordered</TableHead>
                                                <TableHead className="text-right">Unit Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewShipment.items.map((si) => (
                                                <TableRow key={si.id}>
                                                    <TableCell className="font-medium">{si.product_name}</TableCell>
                                                    <TableCell className="text-center">{si.quantity_shipped}</TableCell>
                                                    <TableCell className="text-center text-muted-foreground">{si.quantity_ordered}</TableCell>
                                                    <TableCell className="text-right">${si.unit_price.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {viewShipment.notes && (
                                    <div className="rounded-lg border p-3 bg-muted/30">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                                        <p className="text-sm whitespace-pre-wrap">{viewShipment.notes}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Shipment Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>🚚 Create New Shipment</DialogTitle>
                        <DialogDescription>
                            {selectedPO
                                ? `Shipping items for ${selectedPO.po_number}`
                                : "Select a purchase order to ship"}
                        </DialogDescription>
                    </DialogHeader>

                    {!selectedPO ? (
                        <div className="space-y-2">
                            {availablePOs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No accepted POs available for shipping
                                </p>
                            ) : (
                                availablePOs.map((po) => (
                                    <div
                                        key={po.id}
                                        onClick={() => selectPOForShipment(po)}
                                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm">{po.po_number}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {po.line_items.length} items • ${po.total_amount.toLocaleString()}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Carrier + Tracking */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Carrier</label>
                                    <Select value={carrier} onValueChange={setCarrier}>
                                        <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FedEx">FedEx</SelectItem>
                                            <SelectItem value="UPS">UPS</SelectItem>
                                            <SelectItem value="DHL">DHL</SelectItem>
                                            <SelectItem value="USPS">USPS</SelectItem>
                                            <SelectItem value="BlueDart">BlueDart</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Tracking Number</label>
                                    <Input
                                        placeholder="e.g. FDX123456789"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Estimated Delivery</label>
                                <Input
                                    type="date"
                                    value={estimatedDelivery}
                                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                                />
                            </div>

                            {/* Items to ship */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Items to Ship</label>
                                {selectedPO.line_items.map((li) => {
                                    const remaining = li.quantity - li.quantity_received;
                                    return (
                                        <div key={li.id} className="flex items-center gap-3 p-2 rounded-lg border">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{li.product_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Ordered: {li.quantity} | Remaining: {remaining}
                                                </p>
                                            </div>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={remaining}
                                                value={shipItems[li.id] ?? remaining}
                                                onChange={(e) => setShipItems((prev) => ({
                                                    ...prev,
                                                    [li.id]: parseInt(e.target.value) || 0,
                                                }))}
                                                className="w-24 text-center"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <Textarea
                                placeholder="Shipment notes..."
                                value={shipNotes}
                                onChange={(e) => setShipNotes(e.target.value)}
                            />

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedPO(null)}>Back</Button>
                                <Button
                                    onClick={handleCreateShipment}
                                    disabled={creating}
                                    className="bg-violet-600 hover:bg-violet-700"
                                >
                                    {creating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                                    ) : (
                                        <><Truck className="mr-2 h-4 w-4" /> Dispatch Shipment</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={!!updateTarget} onOpenChange={() => setUpdateTarget(null)}>
                <DialogContent className="max-w-md">
                    {updateTarget && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    Update {updateTarget.shipment_number}
                                </DialogTitle>
                                <DialogDescription>
                                    Mark shipment as {newStatus.replace(/_/g, " ")}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                {newStatus === "in_transit" && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Tracking Number</label>
                                        <Input
                                            value={updateTracking}
                                            onChange={(e) => setUpdateTracking(e.target.value)}
                                            placeholder="Update tracking number"
                                        />
                                    </div>
                                )}
                                <Textarea
                                    placeholder="Notes..."
                                    value={updateNotes}
                                    onChange={(e) => setUpdateNotes(e.target.value)}
                                />
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setUpdateTarget(null)}>Cancel</Button>
                                <Button
                                    onClick={handleUpdateShipment}
                                    disabled={updating}
                                    className={newStatus === "delivered" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}
                                >
                                    {updating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                    ) : (
                                        `Mark ${newStatus.replace(/_/g, " ")}`
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
