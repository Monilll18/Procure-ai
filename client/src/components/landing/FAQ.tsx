"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
    {
        q: "Can I try ProcureAI for free?",
        a: "Yes! We offer a 14-day free trial on all plans. No credit card required to start."
    },
    {
        q: "How does the AI forecasting work?",
        a: "Our AI analyzes your historical purchase data, seasonal trends, and current inventory usage rates to predict future needs with high accuracy."
    },
    {
        q: "Can I integrate with my existing ERP?",
        a: "Absolutely. We support integrations with SAP, Oracle, NetSuite, and QuickBooks out of the box."
    },
    {
        q: "Is my data secure?",
        a: "We use bank-grade AES-256 encryption and are SOC 2 Type II compliant. Your data security is our top priority."
    }
];

export function FAQ() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-6 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground mb-4">
                        FAQ
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                        Got questions? We&apos;ve got answers
                    </h2>
                </motion.div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                            viewport={{ once: true }}
                        >
                            <AccordionItem value={`item-${i}`}>
                                <AccordionTrigger className="text-left text-lg">{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
