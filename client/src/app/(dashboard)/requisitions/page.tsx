"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dummy Data
const requests = [
    { id: "PR-2026-089", requester: "You", dept: "Kitchen", items: 4, total: "₹12,400", date: "Today", status: "Draft" },
    { id: "PR-2026-080", requester: "You", dept: "Kitchen", items: 12, total: "₹45,200", date: "Yesterday", status: "Pending Approval" },
    { id: "PR-2026-075", requester: "Sarah L.", dept: "Front Desk", items: 2, total: "₹2,100", date: "Feb 10", status: "Approved" },
    { id: "PR-2026-072", requester: "Mike R.", dept: "Maintenance", items: 1, total: "₹8,500", date: "Feb 08", status: "Rejected" },
];

export default function RequisitionsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Requisitions</h2>
                    <p className="text-muted-foreground">Create and track purchase requests.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Requisition
                </Button>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Requests</TabsTrigger>
                    <TabsTrigger value="drafts">Drafts</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-4 py-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search PR number..." className="pl-9" />
                    </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Requests</CardTitle>
                            <CardDescription>Manage your purchase requisitions and check their status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PR Number</TableHead>
                                        <TableHead>Requester</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total Cost</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {req.id}
                                                </div>
                                            </TableCell>
                                            <TableCell>{req.requester}</TableCell>
                                            <TableCell>{req.dept}</TableCell>
                                            <TableCell>{req.items}</TableCell>
                                            <TableCell>{req.total}</TableCell>
                                            <TableCell>{req.date}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={req.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* Other tabs would have filtered content in real app */}
            </Tabs>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        Draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
        "Pending Approval": "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        Approved: "bg-green-100 text-green-700 hover:bg-green-100",
        Rejected: "bg-red-100 text-red-700 hover:bg-red-100",
    };
    return (
        <Badge variant="secondary" className={styles[status as keyof typeof styles] || ""}>
            {status}
        </Badge>
    );
}
