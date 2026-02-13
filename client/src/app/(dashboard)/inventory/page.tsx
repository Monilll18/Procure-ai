"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Dummy Data
const inventory = [
    { id: "INV-001", product: "Tomatoes", sku: "TOM-ORG-01", stock: 20, max: 200, reorder: 50, status: "Critical" },
    { id: "INV-002", product: "Olive Oil", sku: "OIL-EV-5L", stock: 5, max: 20, reorder: 8, status: "Low" },
    { id: "INV-003", product: "Basmati Rice", sku: "RICE-BAS-25", stock: 180, max: 300, reorder: 100, status: "Good" },
    { id: "INV-004", product: "Chicken Breast", sku: "CHK-BR-10", stock: 45, max: 100, reorder: 30, status: "Medium" },
    { id: "INV-005", product: "Paper Napkins", sku: "NAP-100", stock: 420, max: 1000, reorder: 100, status: "Good" },
    { id: "INV-006", product: "Dish Soap", sku: "SOAP-5L", stock: 12, max: 50, reorder: 15, status: "Low" },
];

export default function InventoryPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground">Real-time stock levels and health monitoring.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Adjust Stock</Button>
                    <Button>Audit Inventory</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatusCard title="Heathy Items" count={142} icon={<CheckCircle className="text-green-500" />} />
                <StatusCard title="Low Stock" count={12} icon={<AlertCircle className="text-yellow-500" />} />
                <StatusCard title="Critical (Out of Stock)" count={3} icon={<AlertTriangle className="text-red-500" />} />
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search inventory..." className="pl-9" />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" /> Filter Status
                </Button>
            </div>

            {/* Inventory List */}
            <div className="rounded-xl border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="w-[300px]">Availability</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.map((item) => {
                            const percent = (item.stock / item.max) * 100;
                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.product}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Progress value={percent} className={`h-2 ${item.status === 'Critical' ? 'bg-red-100' : item.status === 'Low' ? 'bg-yellow-100' : 'bg-gray-100'}`} indicatorColor={item.status === 'Critical' ? 'bg-red-500' : item.status === 'Low' ? 'bg-yellow-500' : 'bg-green-500'} />
                                            <span className="text-xs text-muted-foreground w-12">{Math.round(percent)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.stock} / {item.max}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            item.status === 'Critical' ? 'border-red-200 bg-red-50 text-red-700' :
                                                item.status === 'Low' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                                    'border-green-200 bg-green-50 text-green-700'
                                        }>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function StatusCard({ title, count, icon }: { title: string, count: number, icon: React.ReactNode }) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{count}</p>
                </div>
                {icon}
            </CardContent>
        </Card>
    )
}
