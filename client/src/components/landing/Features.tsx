"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap, BarChart3, Lock, Globe, Layers } from "lucide-react";
import { motion, Variants } from "framer-motion";

const features = [
    {
        title: "AI-Powered Insights",
        description: "Get real-time actionable insights on spending patterns and savings opportunities.",
        icon: Brain,
    },
    {
        title: "Automated Workflows",
        description: "Streamline approvals and purchase orders with intelligent automation rules.",
        icon: Zap,
    },
    {
        title: "Advanced Analytics",
        description: "Visualize data with customizable dashboards and granular reporting.",
        icon: BarChart3,
    },
    {
        title: "Enterprise Security",
        description: "Bank-grade encryption and compliance with global security standards.",
        icon: Lock,
    },
    {
        title: "Global Sourcing",
        description: "Connect with verified suppliers worldwide and manage multi-currency transactions.",
        icon: Globe,
    },
    {
        title: "Seamless Integration",
        description: "Integrate effortlessly with your existing ERP and financial systems.",
        icon: Layers,
    },
];

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 50,
            damping: 20
        }
    }
};

export function Features() {
    return (
        <section id="features" className="py-24 bg-secondary/5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-border bg-background/50 text-xs font-medium text-muted-foreground mb-4 backdrop-blur-sm">
                        POWERFUL CAPABILITIES
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                        Everything you need to <span className="text-gradient">optimize procurement</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Built for modern teams who demand speed, accuracy, and intelligence in their purchasing process.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature, index) => (
                        <motion.div key={index} variants={item}>
                            <Card className="h-full border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base text-muted-foreground">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
