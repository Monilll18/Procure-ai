"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// Dummy Data
const forecastData = [
    { month: "Aug", actual: 4000, predicted: 4200 },
    { month: "Sep", actual: 3000, predicted: 3200 },
    { month: "Oct", actual: 2000, predicted: 2400 },
    { month: "Nov", actual: 2780, predicted: 2900 },
    { month: "Dec", actual: 1890, predicted: 2100 },
    { month: "Jan", actual: 2390, predicted: 2500 },
    { month: "Feb", actual: 3490, predicted: 3600 }, // Current
    { month: "Mar", predicted: 4000 },
    { month: "Apr", predicted: 4500 },
    { month: "May", predicted: 5000 },
];

const insights = [
    {
        title: "Bulk Buy Opportunity",
        desc: "Tomatoes price expected to rise by 15% next month. Buy 200kg now to save ₹3,000.",
        impact: "High",
        action: "Order Now",
        type: "saving"
    },
    {
        title: "Supplier Risk Alert",
        desc: "VeggieMart has delayed delivery for 3 consecutive orders. Consider switching to FarmFresh for urgent needs.",
        impact: "Medium",
        action: "View Alternates",
        type: "risk"
    },
    {
        title: "Anomalous Spending",
        desc: "Cleaning supplies spend is 40% higher than average this week.",
        impact: "Low",
        action: "Investigate",
        type: "alert"
    }
];

export default function AIInsightsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-purple-600" /> AI Insights
                </h2>
                <p className="text-muted-foreground">Predictive analytics and smart recommendations for your procurement.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Demand Forecasting Chart */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Demand Forecast (Next 3 Months)</CardTitle>
                        <CardDescription>AI prediction based on historical usage and seasonal trends.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecastData}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="actual" stroke="#8884d8" fillOpacity={1} fill="url(#colorActual)" stackId="1" name="Actual Usage" />
                                    <Area type="monotone" dataKey="predicted" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPredicted)" stackId="1" name="AI Prediction" strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Actionable Insights Cards */}
                <div className="col-span-2 grid gap-4 md:grid-cols-3">
                    {insights.map((insight, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className={`absolute left-0 top-0 w-1 h-full ${insight.type === 'saving' ? 'bg-green-500' : insight.type === 'risk' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className={insight.type === 'saving' ? 'border-green-200 text-green-700 bg-green-50' : insight.type === 'risk' ? 'border-orange-200 text-orange-700 bg-orange-50' : 'border-blue-200 text-blue-700 bg-blue-50'}>
                                        {insight.type === 'saving' ? 'Saving Opportunity' : insight.type === 'risk' ? 'Risk Alert' : 'Anomaly'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{insight.impact} Impact</span>
                                </div>
                                <CardTitle className="text-lg mt-2">{insight.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4 h-12">{insight.desc}</p>
                                <Button variant="secondary" className="w-full justify-between group">
                                    {insight.action}
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
