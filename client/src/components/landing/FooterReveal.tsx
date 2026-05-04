"use client";

import React, { useEffect, useRef } from "react";
import { Footer } from "@/components/ui/footer-section";

export function FooterReveal() {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (footerRef.current) {
        document.documentElement.style.setProperty('--footer-height', `${footerRef.current.offsetHeight}px`);
      }
    };
    
    // Initial update
    updateHeight();
    
    // Add resize observer for more robust updates
    const resizeObserver = new ResizeObserver(() => updateHeight());
    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }
    
    window.addEventListener('resize', updateHeight);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <div 
      className="relative z-0"
      style={{ 
        height: "var(--footer-height, 400px)",
        clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" 
      }}
    >
      <div className="fixed bottom-0 w-full" ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
}
