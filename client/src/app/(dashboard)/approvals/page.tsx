"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Dummy Data
const pendingApprovals = [
    {
        id: "PR-2026-080",
        requester: "Amit Patel",
        role: "Kitchen Head",
        dept: "Kitchen",
        items: [
            { name: "Premium Tomatoes", qty: "200 kg", price: "₹9,000" },
            { name: "Onions", qty: "100 kg", price: "₹3,400" }
        ],
        total: "₹12,400",
        date: "2 hours ago",
        urgency: "High",
        steps: [
            { role: "Manager", status: "You", date: "Now" },
            { role: "Finance", status: "Waiting", date: "" },
            { role: "Director", status: "Waiting", date: "" }
        ]
    },
    {
        id: "PR-2026-085",
        requester: "Sarah Lee",
        role: "Admin",
        dept: "Office",
        items: [
            { name: "Printer Paper (A4)", qty: "50 rims", price: "₹12,500" },
        ],
        total: "₹12,500",
        date: "5 hours ago",
        urgency: "Medium",
        steps: [
            { role: "Manager", status: "You", date: "Now" },
            { role: "Finance", status: "Waiting", date: "" }
        ]
    }
];

export default function ApprovalsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
                <p className="text-muted-foreground">Review and take action on purchase requests.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {pendingApprovals.map((approval) => (
                    <Card key={approval.id} className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <Avatar>
                                        <AvatarFallback className="bg-purple-100 text-purple-700">{approval.requester.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{approval.requester}</CardTitle>
                                        <CardDescription>{approval.role} • {approval.dept}</CardDescription>
                                    </div>
                                </div>
                                <Badge variant={approval.urgency === 'High' ? 'destructive' : 'secondary'}>
                                    {approval.urgency === 'High' && <AlertCircle className="w-3 h-3 mr-1" />}
                                    {approval.urgency} Priority
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2 mb-4">
                                <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                                    <span>Request #{approval.id}</span>
                                    <span>{approval.date}</span>
                                </div>
                                {approval.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span>{item.qty} x {item.name}</span>
                                        <span>{item.price}</span>
                                    </div>
                                ))}
                                <div className="border-t pt-2 flex justify-between font-bold text-base mt-2">
                                    <span>Total</span>
                                    <span>{approval.total}</span>
                                </div>
                            </div>

                            {/* Progress Stepper */}
                            <div className="relative flex items-center justify-between text-xs text-muted-foreground mt-4 px-2">
                                {/* Line */}
                                <div className="absolute left-0 top-2.5 h-0.5 w-[90%] bg-gray-100 -z-10 mx-4"></div>

                                {approval.steps.map((step, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 bg-white px-1">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${step.status === 'You' ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-gray-200 bg-white'}`}>
                                            {step.status === 'You' ? <div className="w-2 h-2 bg-purple-600 rounded-full" /> : i === 0 ? <Check className="w-3 h-3" /> : ''}
                                        </div>
                                        <span className={step.status === 'You' ? 'font-medium text-foreground' : ''}>{step.role}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-3 border-t bg-gray-50/50 p-4">
                            <Button variant="outline" className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                <X className="w-4 h-4 mr-2" /> Reject
                            </Button>
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                                <Check className="w-4 h-4 mr-2" /> Approve
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
