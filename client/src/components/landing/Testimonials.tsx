"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/3d-testimonials";
import { Instrument_Serif } from "next/font/google";
import ScrollRevealText from "@/components/ui/ScrollRevealText";
import { cn } from "@/lib/utils";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

const testimonials = [
    {
        quote: "Finally, an analytics tool that doesn't require a PhD to understand. The automated insights save us hours every week.",
        name: "Emily Watson",
        title: "CEO at StartupXYZ",
        avatar: "EW",
        img: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    {
        quote: "The user segmentation features are incredible. We can now target our campaigns with precision and see immediate results.",
        name: "David Chen",
        title: "Growth Lead at ScaleUp",
        avatar: "DC",
        img: "https://randomuser.me/api/portraits/men/51.jpg"
    },
    {
        quote: "Best investment we've made for our startup. The ROI tracking and funnel analysis helped us optimize our entire sales process.",
        name: "Lisa Thompson",
        title: "Marketing Director at InnovateCorp",
        avatar: "LT",
        img: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
        quote: "Automated reordering has completely eliminated our stockout issues. Highly recommended!",
        name: "Mark Johnson",
        title: "Ops Manager at FreshFoods",
        avatar: "MJ",
        img: "https://randomuser.me/api/portraits/men/33.jpg"
    },
    {
        quote: "The supplier scoring system gave us negotiation power we didn't know we had. Saved 15% in Q1.",
        name: "Sarah Lee",
        title: "Procurement Head at TechGiant",
        avatar: "SL",
        img: "https://randomuser.me/api/portraits/women/53.jpg"
    },
];

function TestimonialCard({ img, name, title, quote, avatar }: (typeof testimonials)[number]) {
  return (
    <Card className="w-[300px] md:w-[350px] lg:w-[400px] bg-background border-border/50 hover:border-primary/50 transition-colors shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-10 w-10">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">{avatar}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-semibold text-foreground flex items-center gap-1">
              {name}
            </figcaption>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm text-foreground/80 italic leading-relaxed">"{quote}"</blockquote>
      </CardContent>
    </Card>
  );
}

export function Testimonials() {
    return (
        <section id="testimonials" className="relative z-10 py-24 bg-background overflow-hidden flex flex-col items-center justify-center">
            <AnimatedGridPattern
                numSquares={30}
                maxOpacity={0.1}
                duration={3}
                repeatDelay={1}
                className={cn(
                    "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
                    "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
                )}
            />
            <div className="container mx-auto px-6 mb-16 text-center relative z-20">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground mb-4">
                    TESTIMONIALS
                </div>
                <ScrollRevealText className={`${instrument.className} text-5xl md:text-7xl font-normal text-foreground mb-6 leading-[0.95] tracking-[-1px]`}>
                    Loved by thousands
                </ScrollRevealText>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    See what our customers are saying about their experience with ProcureAI.
                </p>
            </div>

            <div className="flex justify-center w-full px-4 md:px-0">
               <div className="relative flex h-[500px] w-full max-w-[1400px] flex-row items-center justify-center overflow-hidden gap-4 md:gap-6 [perspective:800px]">
                 <div
                   className="flex flex-row items-center gap-4 w-full justify-center"
                   style={{
                     transform:
                       'translateX(-120px) translateY(0px) translateZ(-50px) rotateX(15deg) rotateY(-10deg) rotateZ(5deg)',
                     transformStyle: 'preserve-3d',
                   }}
                 >
                   {/* Vertical Marquee (downwards) */}
                   <Marquee vertical pauseOnHover repeat={4} className="[--duration:50s] hidden md:flex">
                     {testimonials.map((review, i) => (
                       <TestimonialCard key={`col1-${i}`} {...review} />
                     ))}
                   </Marquee>
                   {/* Vertical Marquee (upwards) */}
                   <Marquee vertical pauseOnHover reverse repeat={4} className="[--duration:40s]">
                     {testimonials.map((review, i) => (
                       <TestimonialCard key={`col2-${i}`} {...review} />
                     ))}
                   </Marquee>
                   {/* Vertical Marquee (downwards) */}
                   <Marquee vertical pauseOnHover repeat={4} className="[--duration:45s]">
                     {testimonials.map((review, i) => (
                       <TestimonialCard key={`col3-${i}`} {...review} />
                     ))}
                   </Marquee>
                    {/* Vertical Marquee (upwards) */}
                   <Marquee vertical pauseOnHover reverse repeat={4} className="[--duration:55s] hidden lg:flex">
                     {testimonials.map((review, i) => (
                       <TestimonialCard key={`col4-${i}`} {...review} />
                     ))}
                   </Marquee>
                 </div>

                 {/* Gradient overlays for vertical marquee */}
                 <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background via-background/80 to-transparent z-10"></div>
                 <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
               </div>
            </div>
        </section>
    );
}
