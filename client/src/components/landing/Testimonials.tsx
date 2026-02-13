"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Marquee } from "@/components/ui/marquee";

const testimonials = [
    {
        quote: "Finally, an analytics tool that doesn't require a PhD to understand. The automated insights save us hours every week.",
        name: "Emily Watson",
        title: "CEO at StartupXYZ",
        avatar: "EW"
    },
    {
        quote: "The user segmentation features are incredible. We can now target our campaigns with precision and see immediate results.",
        name: "David Chen",
        title: "Growth Lead at ScaleUp",
        avatar: "DC"
    },
    {
        quote: "Best investment we've made for our startup. The ROI tracking and funnel analysis helped us optimize our entire sales process.",
        name: "Lisa Thompson",
        title: "Marketing Director at InnovateCorp",
        avatar: "LT"
    },
    {
        quote: "Automated reordering has completely eliminated our stockout issues. Highly recommended!",
        name: "Mark Johnson",
        title: "Ops Manager at FreshFoods",
        avatar: "MJ"
    },
    {
        quote: "The supplier scoring system gave us negotiation power we didn't know we had. Saved 15% in Q1.",
        name: "Sarah Lee",
        title: "Procurement Head at TechGiant",
        avatar: "SL"
    },
];

export function Testimonials() {

    const items = testimonials.map((t, i) => (
        <div key={i} className="w-[350px] flex-shrink-0 p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors h-full flex flex-col justify-between">
            <div>
                <div className="flex gap-1 text-primary mb-4">
                    {[...Array(5)].map((_, i) => (
                        <span key={i} className="w-4 h-4 fill-current">★</span>
                    ))}
                </div>
                <p className="text-lg text-foreground leading-relaxed mb-6">
                    "{t.quote}"
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">{t.avatar}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.title}</p>
                </div>
            </div>
        </div>
    ));

    return (
        <section id="testimonials" className="py-24 bg-background overflow-hidden">
            <div className="container mx-auto px-6 mb-16 text-center">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground mb-4">
                    TESTIMONIALS
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                    Loved by thousands
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    See what our customers are saying about their experience with ProcureAI.
                </p>
            </div>

            <div className="relative">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <Marquee items={items} direction="left" speed="slow" className="py-8" />
            </div>
        </section>
    );
}
