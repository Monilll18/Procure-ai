"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Dummy Data for Charts
const spendData = [
    { name: "Jan", total: 2400 },
    { name: "Feb", total: 1398 },
    { name: "Mar", total: 9800 },
    { name: "Apr", total: 3908 },
    { name: "May", total: 4800 },
    { name: "Jun", total: 3800 },
];

const supplierData = [
    { name: "FarmFresh", orders: 45 },
    { name: "VeggieMart", orders: 32 },
    { name: "AgriDirect", orders: 28 },
    { name: "PackPro", orders: 15 },
];

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, Manager 👋</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button>+ New Order</Button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Spend"
                    value="₹4,82,000"
                    trend="+12% from last month"
                    trendUp={true}
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                />
                <KPICard
                    title="Active POs"
                    value="12"
                    trend="+3 new this week"
                    trendUp={true}
                    icon={<MoreHorizontal className="h-4 w-4 text-muted-foreground" />}
                />
                <KPICard
                    title="Low Stock Alerts"
                    value="5"
                    trend="-2 from yesterday"
                    trendUp={false} // actually good here but for UI let's show red/green logic later
                    icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                    className="border-l-4 border-l-red-500"
                />
                <KPICard
                    title="Monthly Savings"
                    value="₹62,000"
                    trend="+8% vs avg"
                    trendUp={true}
                    icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Spend Chart (4 cols) */}
                <Card className="col-span-4 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Spend Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={spendData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="total" stroke="#7C3AED" fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Suppliers (3 cols) */}
                <Card className="col-span-3 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Top Suppliers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {['FarmFresh', 'VeggieMart', 'AgriDirect', 'PackPro'].map((supplier, i) => (
                                <div key={supplier} className="flex items-center">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{supplier.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{supplier}</p>
                                        <p className="text-xs text-muted-foreground">rating: {5 - (i * 0.2)}★</p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm">₹{12000 - (i * 1500)}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Recent Orders & AI Insights */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Recent POs Table */}
                <Card className="col-span-4 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Purchase Orders</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { id: "PO-245", supplier: "FarmFresh", status: "Approved", amount: "₹7,200" },
                                    { id: "PO-244", supplier: "VeggieMart", status: "Pending", amount: "₹12,400" },
                                    { id: "PO-243", supplier: "AgriDirect", status: "Draft", amount: "₹5,800" },
                                    { id: "PO-242", supplier: "PackPro", status: "Approved", amount: "₹2,100" },
                                ].map((po) => (
                                    <TableRow key={po.id}>
                                        <TableCell className="font-medium">{po.id}</TableCell>
                                        <TableCell>{po.supplier}</TableCell>
                                        <TableCell>
                                            <Badge variant={po.status === "Approved" ? "default" : po.status === "Pending" ? "secondary" : "outline"} className={po.status === "Approved" ? "bg-green-100 text-green-700 hover:bg-green-100" : po.status === "Pending" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" : "text-gray-600"}>
                                                {po.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{po.amount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* AI Reorder Suggestions */}
                <Card className="col-span-3 bg-purple-50/50 border-purple-100 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-purple-900 flex items-center gap-2">
                            ✨ AI Reorder Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { name: "Tomatoes", stock: "20kg (Critical)", supplier: "FarmFresh", price: "₹45/kg" },
                            { name: "Olive Oil", stock: "5L (Low)", supplier: "OilMart", price: "₹320/L" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{item.name}</p>
                                    <p className="text-xs text-red-500 font-semibold">{item.stock}</p>
                                    <p className="text-xs text-muted-foreground">Best: {item.supplier} ({item.price})</p>
                                </div>
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs">
                                    Create Order
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

function KPICard({ title, value, trend, trendUp, icon, className }: { title: string, value: string, trend: string, trendUp: boolean, icon: React.ReactNode, className?: string }) {
    return (
        <Card className={`hover:shadow-md transition-shadow ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className={`text-xs flex items-center mt-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trendUp ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                    {trend}
                </p>
            </CardContent>
        </Card>
    )
}
