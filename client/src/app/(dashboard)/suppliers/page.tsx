"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Truck, Star, Phone, Mail, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dummy Data
const suppliers = [
    { id: 1, name: "FarmFresh Produce", category: "Vegetables", rating: 4.8, contact: "John Doe", phone: "+91 98765 43210", email: "orders@farmfresh.com", location: "Pune, MH", items: 24 },
    { id: 2, name: "VeggieMart Wholesale", category: "Vegetables", rating: 4.2, contact: "Amit Singh", phone: "+91 98765 12345", email: "sales@veggiemart.com", location: "Mumbai, MH", items: 15 },
    { id: 3, name: "AgriDirect", category: "Grains", rating: 4.5, contact: "Sarah Lee", phone: "+91 99887 76655", email: "sarah@agridirect.com", location: "Nashik, MH", items: 8 },
    { id: 4, name: "PackPro Solutions", category: "Packaging", rating: 4.0, contact: "Rahul Verma", phone: "+91 88776 65544", email: "info@packpro.com", location: "Mumbai, MH", items: 42 },
    { id: 5, name: "CleanSweep Suppliers", category: "Cleaning", rating: 3.8, contact: "Priya K", phone: "+91 77665 54433", email: "orders@cleansweep.com", location: "Pune, MH", items: 12 },
];

export default function SuppliersPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
                    <p className="text-muted-foreground">Manage your vendor relationships and performance.</p>
                </div>
                <Button>
                    <Truck className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search suppliers..." className="pl-9" />
                </div>
            </div>

            {/* Supplier Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((supplier) => (
                    <Card key={supplier.id} className="hover:shadow-md transition-shadow group">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarFallback className="bg-purple-50 text-purple-700 font-bold">
                                        {supplier.name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{supplier.name}</CardTitle>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{supplier.category}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {supplier.rating}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-2">
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {supplier.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {supplier.contact}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    {supplier.location}
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t mt-3">
                                <span className="text-xs text-muted-foreground">{supplier.items} Products</span>
                                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 -mr-2">
                                    View Catalog
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
