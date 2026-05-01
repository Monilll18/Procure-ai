"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import ScrollRevealText from "@/components/ui/ScrollRevealText";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

const faqs = [
  {
    question: "WHAT IS PROCURE AI?",
    answer: "AN AI-POWERED PLATFORM THAT AUTOMATES SOURCING, APPROVALS, AND 3-WAY MATCHING"
  },
  {
    question: "HOW FAST IS IMPLEMENTATION?",
    answer: "OUR AVERAGE GO-LIVE TIME IS UNDER 4 WEEKS WITH SEAMLESS ERP INTEGRATION"
  },
  {
    question: "DO YOU SUPPORT GLOBAL SOURCING?",
    answer: "YES, ACCESS 1,400+ VERIFIED SUPPLIERS ACROSS 112 COUNTRIES WITH REAL-TIME COMPLIANCE"
  },
  {
    question: "CAN IT DETECT INVOICE FRAUD?",
    answer: "OUR AI MODELS FLAG ANOMALIES AND DISCREPANCIES WITH 99.7% ACCURACY INSTANTLY"
  }
];

export function FAQ() {
  return (
    <section id="faq" className="w-full bg-[#010101] text-white flex flex-col items-center justify-center border-t border-white/10 py-24 z-10 relative">
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-16 items-start">
        
        {/* Left: The Component We Built (FAQ List) */}
        <div className="flex flex-col border-t border-white/10 order-2 md:order-1">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        {/* Right: Description */}
        <div className="flex flex-col justify-start order-1 md:order-2 md:pl-12 pt-4">
          <ScrollRevealText className={`${instrument.className} text-5xl md:text-7xl font-normal tracking-tight mb-6 text-foreground leading-[0.95]`}>
            Frequently Asked Questions
          </ScrollRevealText>
          <p className="text-muted-foreground text-lg mb-8 max-w-sm leading-relaxed">
            Everything you need to know about our AI procurement platform.
          </p>
          <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
            Can't find what you're looking for? Reach out to our <span className="text-foreground font-medium cursor-pointer hover:underline">support team</span> for assistance.
          </p>
        </div>

      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isHovered, setIsHovered] = useState(false);

  // Repeat enough to ensure marquee loop is seamless
  const singleText = `${answer} • `;
  const repeatedHalf = singleText.repeat(8);
  const fullText = repeatedHalf + repeatedHalf; // Two identical halves

  return (
    <div 
      className="w-full relative border-b border-white/10 h-16 sm:h-20 flex items-center overflow-hidden cursor-pointer bg-[#010101] text-white transition-colors duration-300 px-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {!isHovered ? (
          <motion.h3
            key="question"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight absolute bg-gradient-to-br from-white via-[#f0f0f0] to-white bg-clip-text text-transparent"
          >
            {question}
          </motion.h3>
        ) : (
          <motion.div
            key="answer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center left-0 w-full h-full bg-white text-black z-10"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)"
            }}
          >
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: [0, "-50%"] }}
              transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
            >
               <span className="text-base sm:text-lg md:text-xl font-medium tracking-wide">
                 {fullText}
               </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
