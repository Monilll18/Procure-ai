"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Eye, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dummy Data
const orders = [
    { id: "PO-2026-045", supplier: "FarmFresh Produce", date: "Feb 12, 2026", total: "₹7,200", status: "Sent", items: 2 },
    { id: "PO-2026-044", supplier: "VeggieMart Wholesale", date: "Feb 11, 2026", total: "₹12,400", status: "Pending Approval", items: 5 },
    { id: "PO-2026-043", supplier: "AgriDirect", date: "Feb 10, 2026", total: "₹5,800", status: "Draft", items: 1 },
    { id: "PO-2026-042", supplier: "PackPro Solutions", date: "Feb 08, 2026", total: "₹2,100", status: "Received", items: 10 },
    { id: "PO-2026-041", supplier: "CleanSweep Suppliers", date: "Feb 05, 2026", total: "₹1,200", status: "Closed", items: 3 },
];

export default function PurchaseOrdersPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
                    <p className="text-muted-foreground">Track and manage orders sent to suppliers.</p>
                </div>
                <Button>
                    Create Manual PO
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Orders</TabsTrigger>
                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                    <TabsTrigger value="active">Active (Sent)</TabsTrigger>
                    <TabsTrigger value="closed">Closed/Received</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search PO number or supplier..." className="pl-9" />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                </div>

                <TabsContent value="all" className="space-y-4">
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
                                    {orders.map((po) => (
                                        <TableRow key={po.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium text-purple-700">{po.id}</TableCell>
                                            <TableCell>{po.supplier}</TableCell>
                                            <TableCell>{po.date}</TableCell>
                                            <TableCell>{po.items}</TableCell>
                                            <TableCell>{po.total}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={po.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" title="View Details">
                                                        <Eye className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    {po.status === 'Draft' && (
                                                        <Button variant="ghost" size="icon" title="Send to Supplier">
                                                            <Send className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                    )}
                                                    {['Sent', 'Received', 'Closed'].includes(po.status) && (
                                                        <Button variant="ghost" size="icon" title="Download PDF">
                                                            <Download className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        Draft: "bg-gray-100 text-gray-700",
        "Pending Approval": "bg-yellow-100 text-yellow-700",
        Sent: "bg-blue-100 text-blue-700",
        Received: "bg-purple-100 text-purple-700",
        Closed: "bg-green-100 text-green-700",
    };
    return (
        <Badge variant="outline" className={`border-0 ${styles[status as keyof typeof styles] || "bg-gray-100"}`}>
            {status}
        </Badge>
    );
}
