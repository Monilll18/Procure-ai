"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreHorizontal, Package } from "lucide-react";

// Dummy Data
const products = [
    { id: "PROD-001", name: "Premium Tomatoes", category: "Produce", sku: "TOM-ORG-01", stock: 20, unit: "kg", reorderPoint: 50, status: "Critical" },
    { id: "PROD-002", name: "Olive Oil (Extra Virgin)", category: "Oils", sku: "OIL-EV-5L", stock: 5, unit: "L", reorderPoint: 10, status: "Low" },
    { id: "PROD-003", name: "Basmati Rice", category: "Grains", sku: "RICE-BAS-25", stock: 200, unit: "kg", reorderPoint: 100, status: "Good" },
    { id: "PROD-004", name: "Chicken Breast", category: "Meat", sku: "CHK-BR-10", stock: 45, unit: "kg", reorderPoint: 30, status: "Medium" },
    { id: "PROD-005", name: "Paper Napkins", category: "Supplies", sku: "NAP-100", stock: 500, unit: "pack", reorderPoint: 100, status: "Good" },
    { id: "PROD-006", name: "Dish Soap", category: "Cleaning", sku: "SOAP-5L", stock: 12, unit: "L", reorderPoint: 15, status: "Low" },
];

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">Manage your product catalog and thresholds.</p>
                </div>
                <Button className="w-full md:w-auto">
                    <Package className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" /> Filter
                </Button>
            </div>

            {/* Products Table */}
            <div className="rounded-xl border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stock Level</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id} className="group cursor-pointer hover:bg-muted/50">
                                <TableCell className="font-medium text-purple-900 group-hover:text-purple-700">
                                    {product.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono text-xs">{product.sku}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>
                                    {product.stock} <span className="text-muted-foreground text-xs">{product.unit}</span>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={product.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        Good: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
        Medium: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
        Low: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
        Critical: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
    };
    return (
        <Badge variant="outline" className={`font-medium ${styles[status as keyof typeof styles] || "bg-gray-100"}`}>
            {status}
        </Badge>
    );
}
