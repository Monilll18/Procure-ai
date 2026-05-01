"use client";

import { AnimatedCarousel } from "@/components/ui/logo-carousel";

const partnerLogos = [
  { src: "https://cdn.worldvectorlogo.com/logos/react-2.svg", alt: "React" },
  { src: "https://cdn.worldvectorlogo.com/logos/next-js.svg", alt: "Next.js" },
  { src: "https://cdn.worldvectorlogo.com/logos/vercel.svg", alt: "Vercel" },
  { src: "https://cdn.worldvectorlogo.com/logos/typescript.svg", alt: "TypeScript" },
  { src: "https://cdn.worldvectorlogo.com/logos/tailwindcss.svg", alt: "Tailwind CSS" },
  { src: "https://cdn.worldvectorlogo.com/logos/stripe-4.svg", alt: "Stripe" },
  { src: "https://cdn.worldvectorlogo.com/logos/notion-2.svg", alt: "Notion" },
  { src: "https://cdn.worldvectorlogo.com/logos/github-icon-1.svg", alt: "GitHub" },
  { src: "https://cdn.worldvectorlogo.com/logos/figma-icon-one-color.svg", alt: "Figma" },
  { src: "https://cdn.worldvectorlogo.com/logos/framer-motion.svg", alt: "Framer Motion" },
  { src: "https://cdn.worldvectorlogo.com/logos/storybook-1.svg", alt: "Storybook" },
  { src: "https://cdn.worldvectorlogo.com/logos/sanity.svg", alt: "Sanity" },
];

export function Partners() {
  return (
    <section className="bg-background border-y border-border/40">
      <AnimatedCarousel 
        title="Trusted by Innovative Teams"
        logos={partnerLogos.map(logo => logo.src)}
        autoPlay={true}
        autoPlayInterval={3000}
        itemsPerViewMobile={3}
        itemsPerViewDesktop={6}
        logoContainerWidth="w-40"
        logoContainerHeight="h-20"
        logoImageWidth="w-auto"
        logoImageHeight="h-10"
        padding="py-16"
        spacing="gap-12"
      />
    </section>
  );
}
