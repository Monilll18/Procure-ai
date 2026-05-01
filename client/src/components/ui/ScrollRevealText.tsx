"use client";

import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollRevealTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  ghostOpacity?: number;
  speed?: number;
}

function RevealWord({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  return (
    <motion.span style={{ opacity, display: "inline" }}>
      {word}
    </motion.span>
  );
}

export default function ScrollRevealText({
  children,
  className = "",
  as: Tag = "h2",
  ghostOpacity = 0.15,
  speed = 1,
}: ScrollRevealTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "start 0.25"],
  });

  const progress = useTransform(scrollYProgress, (v) =>
    Math.max(0, Math.min(1, v * speed))
  );

  const raw = children.trim();
  const words = useMemo(() => raw.split(/\s+/), [raw]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Tag className={className} style={{ position: "relative" }}>
        {/* Ghost layer — always visible, dim */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            pointerEvents: "none",
            opacity: ghostOpacity,
            whiteSpace: "pre-wrap",
          }}
        >
          {raw}
        </span>

        {/* Animated layer — words reveal on scroll */}
        <span style={{ position: "relative" }}>
          {words.map((word, i) => (
            <span key={`w-${i}`}>
              <RevealWord
                word={word}
                index={i}
                total={words.length}
                progress={progress}
              />
              {i < words.length - 1 && <span>{" "}</span>}
            </span>
          ))}
        </span>
      </Tag>
    </div>
  );
}
