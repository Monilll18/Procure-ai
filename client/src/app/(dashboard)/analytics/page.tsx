"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Dummy Data
const categoryData = [
    { name: "Produce", value: 45000 },
    { name: "Grains", value: 32000 },
    { name: "Meat", value: 28000 },
    { name: "Dairy", value: 24000 },
    { name: "Supplies", value: 12000 },
    { name: "Cleaning", value: 8000 },
];

const supplierPerformance = [
    { name: "FarmFresh", onTime: 95, quality: 98 },
    { name: "VeggieMart", onTime: 85, quality: 90 },
    { name: "AgriDirect", onTime: 92, quality: 88 },
    { name: "PackPro", onTime: 98, quality: 99 },
];

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">Detailed reports on spending and supplier performance.</p>
                </div>
                <div className="flex gap-2">
                    {/* <CalendarDateRangePicker /> Placeholder */}
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Spend by Category */}
                <Card>
                    <CardHeader>
                        <CardTitle>Spend by Category</CardTitle>
                        <CardDescription>Total expense distribution this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} stroke="#888888" tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} stroke="#888888" width={80} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Supplier Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Performance Scores</CardTitle>
                        <CardDescription>Based on delivery speed and product quality ratings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={supplierPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#888888" />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#888888" domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="onTime" name="On-Time Delivery %" fill="#ADFA1D" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="quality" name="Quality Score %" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
