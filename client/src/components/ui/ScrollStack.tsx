import React, { useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';

export interface ScrollStackItemProps {
  itemClassName?: string;
  children: ReactNode;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({ children, itemClassName = '' }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
);

interface ScrollStackProps {
  className?: string;
  children: ReactNode;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const cardOffsetsRef = useRef<number[]>([]);
  const endOffsetRef = useRef(0);
  const lastTransformsRef = useRef(new Map<number, any>());

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value as string);
  }, []);

  // Cache offsets once — avoids getBoundingClientRect every frame
  const cacheOffsets = useCallback(() => {
    const cards = cardsRef.current;
    if (!cards.length) return;

    if (useWindowScroll) {
      cardOffsetsRef.current = cards.map(c => {
        const r = c.getBoundingClientRect();
        return r.top + window.scrollY;
      });
      const end = document.querySelector('.scroll-stack-end') as HTMLElement;
      if (end) {
        const r = end.getBoundingClientRect();
        endOffsetRef.current = r.top + window.scrollY;
      }
    } else {
      cardOffsetsRef.current = cards.map(c => c.offsetTop);
      const scroller = scrollerRef.current;
      const end = scroller?.querySelector('.scroll-stack-end') as HTMLElement;
      if (end) endOffsetRef.current = end.offsetTop;
    }
  }, [useWindowScroll]);

  const updateCardTransforms = useCallback(() => {
    const cards = cardsRef.current;
    const offsets = cardOffsetsRef.current;
    if (!cards.length || !offsets.length) return;

    let scrollTop: number, containerHeight: number;
    if (useWindowScroll) {
      scrollTop = window.scrollY;
      containerHeight = window.innerHeight;
    } else {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      scrollTop = scroller.scrollTop;
      containerHeight = scroller.clientHeight;
    }

    const stackPosPx = parsePercentage(stackPosition, containerHeight);
    const endTop = endOffsetRef.current;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card) continue;

      const cardTop = offsets[i];

      // Pin position: where card sticks
      const pinStart = cardTop - stackPosPx - itemStackDistance * i;
      const pinEnd = endTop - containerHeight / 2;

      // SCALE: starts when card enters viewport bottom, ends when card reaches pin
      // This creates the visible "big → small" transition as card scrolls up
      const scaleStart = cardTop - containerHeight; // card enters bottom edge
      const scaleEnd = pinStart; // card reaches pin position

      let scaleProgress: number;
      if (scrollTop <= scaleStart) scaleProgress = 0;
      else if (scrollTop >= scaleEnd) scaleProgress = 1;
      else scaleProgress = (scrollTop - scaleStart) / (scaleEnd - scaleStart);

      // Ease the scale progress for smoother feel
      scaleProgress = scaleProgress * scaleProgress * (3 - 2 * scaleProgress); // smoothstep

      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      // Blur for deeper stacked cards
      let blur = 0;
      if (blurAmount) {
        let topIdx = 0;
        for (let j = 0; j < cards.length; j++) {
          const jStart = offsets[j] - stackPosPx - itemStackDistance * j;
          if (scrollTop >= jStart) topIdx = j;
        }
        if (i < topIdx) blur = Math.max(0, (topIdx - i) * blurAmount);
      }

      // Pin translation
      let translateY = 0;
      if (scrollTop >= pinStart && scrollTop <= pinEnd) {
        translateY = scrollTop - cardTop + stackPosPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPosPx + itemStackDistance * i;
      }

      // Z-index: later cards stack on top
      card.style.zIndex = `${i + 1}`;

      // Round for sub-pixel stability
      const tY = Math.round(translateY * 10) / 10;
      const s = Math.round(scale * 10000) / 10000;
      const r = Math.round(rotation * 10) / 10;
      const b = Math.round(blur * 10) / 10;

      const last = lastTransformsRef.current.get(i);
      if (
        last &&
        Math.abs(last.tY - tY) < 0.2 &&
        Math.abs(last.s - s) < 0.0002 &&
        Math.abs(last.r - r) < 0.2 &&
        Math.abs(last.b - b) < 0.2
      ) continue;

      card.style.transform = `translate3d(0,${tY}px,0) scale(${s})${r ? ` rotate(${r}deg)` : ''}`;
      if (blurAmount) {
        card.style.filter = b > 0 ? `blur(${b}px)` : 'none';
      }

      lastTransformsRef.current.set(i, { tY, s, r, b });

      // Stack complete callback
      if (i === cards.length - 1) {
        const inView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (inView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!inView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    }
  }, [
    itemScale, itemStackDistance, stackPosition,
    baseScale, rotationAmount, blurAmount, useWindowScroll,
    onStackComplete, parsePercentage
  ]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      const lenis = new Lenis({
        duration: 1.4,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 0.8,
        lerp: 0.08,
        syncTouch: true,
        syncTouchLerp: 0.06
      });
      lenis.on('scroll', handleScroll);
      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);
      lenisRef.current = lenis;
      return lenis;
    } else {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const lenis = new Lenis({
        wrapper: scroller,
        content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
        duration: 1.4,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        gestureOrientation: 'vertical',
        wheelMultiplier: 0.8,
        lerp: 0.08,
        syncTouch: true,
        syncTouchLerp: 0.06
      });
      lenis.on('scroll', handleScroll);
      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);
      lenisRef.current = lenis;
      return lenis;
    }
  }, [handleScroll, useWindowScroll]);

  // Recache on resize
  useEffect(() => {
    const onResize = () => { cacheOffsets(); updateCardTransforms(); };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [cacheOffsets, updateCardTransforms]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(
      useWindowScroll
        ? document.querySelectorAll('.scroll-stack-card')
        : scroller.querySelectorAll('.scroll-stack-card')
    ) as HTMLElement[];

    cardsRef.current = cards;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) card.style.marginBottom = `${itemDistance}px`;
      card.style.willChange = 'transform';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translateZ(0)';
    });

    // Cache after layout
    requestAnimationFrame(() => {
      cacheOffsets();
      updateCardTransforms();
    });

    setupLenis();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (lenisRef.current) lenisRef.current.destroy();
      stackCompletedRef.current = false;
      cardsRef.current = [];
      cardOffsetsRef.current = [];
      lastTransformsRef.current.clear();
    };
  }, [
    itemDistance, itemScale, itemStackDistance, stackPosition,
    baseScale, scaleDuration, rotationAmount,
    blurAmount, useWindowScroll, onStackComplete, setupLenis,
    updateCardTransforms, cacheOffsets
  ]);

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        <div className="scroll-stack-end" />
      </div>
    </div>
  );
};

export default ScrollStack;
