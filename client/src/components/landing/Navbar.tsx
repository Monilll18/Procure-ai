"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import ClickSpark from "@/components/ui/ClickSpark";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

const NAV_LINKS = [
    { name: "Features", href: "#features" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${scrolled ? "bg-background shadow-md border-b border-white/5" : "bg-transparent"}`}>
            <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
                <style jsx>{`
                    .liquid-glass {
                        background: rgba(255, 255, 255, 0.01);
                        background-blend-mode: luminosity;
                        backdrop-filter: blur(4px);
                        -webkit-backdrop-filter: blur(4px);
                        border: none;
                        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
                        position: relative;
                        overflow: hidden;
                    }
                    .liquid-glass::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        border-radius: inherit;
                        padding: 1.4px;
                        background: linear-gradient(180deg,
                            rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
                            rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
                            rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
                        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                        -webkit-mask-composite: xor;
                        mask-composite: exclude;
                        pointer-events: none;
                    }
                `}</style>
                <div className="relative z-10 flex flex-row items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                    {/* Logo */}
                    <Link href="/" className={`${instrument.className} text-3xl tracking-tight text-foreground flex items-baseline`}>
                        Procure AI<sup className="text-xs ml-1">®</sup>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Actions & CTA */}
                    <div className="hidden md:flex items-center gap-6">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Log in
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="liquid-glass rounded-full px-8 py-2.5 text-sm text-foreground transition-transform duration-300 hover:scale-[1.03] cursor-pointer">
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </SignedOut>

                        <SignedIn>
                            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors mr-2">
                                Dashboard
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-background/95 backdrop-blur-md border-b border-border/50"
                        >
                            <div className="flex flex-col p-6 space-y-4">
                                {NAV_LINKS.map((link) => (
                                    <Link 
                                        key={link.name} 
                                        href={link.href} 
                                        onClick={() => setIsOpen(false)} 
                                        className="text-lg font-medium text-foreground"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                <div className="h-px bg-border/50 my-2" />

                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button className="text-left text-lg font-medium text-foreground py-2">
                                            Log in
                                        </button>
                                    </SignInButton>
                                    <SignUpButton mode="modal">
                                        <button className="liquid-glass rounded-full px-8 py-2.5 text-sm text-foreground transition-transform duration-300 hover:scale-[1.03] cursor-pointer mt-2 w-full">
                                            Sign Up
                                        </button>
                                    </SignUpButton>
                                </SignedOut>

                                <SignedIn>
                                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground py-2">
                                        Dashboard
                                    </Link>
                                </SignedIn>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </ClickSpark>
        </nav>
    );
}
