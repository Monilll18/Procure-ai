import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Partners } from "@/components/landing/Partners";
import { Pricing } from "@/components/landing/Pricing";
import { Prism } from "@/components/landing/Prism";
import { FooterReveal } from "@/components/landing/FooterReveal";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <div className="relative z-10 bg-[#010101] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <Navbar />
        <Hero />
        <Partners />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Prism />
      </div>
      <FooterReveal />
    </main>
  );
}
