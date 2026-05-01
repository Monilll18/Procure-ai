"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export interface TabItem {
  name: string;
  href: string;
}

export const SlideTabs = ({ tabs }: { tabs: TabItem[] }) => {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const selectedTab = tabsRef.current[selected];
    if (selectedTab) {
      const { width } = selectedTab.getBoundingClientRect();
      setPosition({
        left: selectedTab.offsetLeft,
        width,
        opacity: 1,
      });
    }
  }, [selected]);

  return (
    <ul
      onMouseLeave={() => {
        const selectedTab = tabsRef.current[selected];
        if (selectedTab) {
            const { width } = selectedTab.getBoundingClientRect();
            setPosition({
                left: selectedTab.offsetLeft,
                width,
                opacity: 1,
            });
        }
      }}
      className="relative mx-auto flex w-fit rounded-full border border-white/10 bg-white/5 backdrop-blur-md p-1 shadow-2xl"
    >
      {tabs.map((tab, i) => (
         <Tab
            key={tab.name}
            ref={(el) => { tabsRef.current[i] = el; }}
            setPosition={setPosition}
            onClick={() => setSelected(i)}
            href={tab.href}
          >
            {tab.name}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
};

const Tab = React.forwardRef<
  HTMLLIElement,
  {
    children: React.ReactNode;
    setPosition: (pos: any) => void;
    onClick: () => void;
    href: string;
  }
>(({ children, setPosition, onClick, href }, ref) => {
  return (
    <li
      ref={ref}
      onClick={onClick}
      onMouseEnter={(e: React.MouseEvent<HTMLLIElement>) => {
        if (!e.currentTarget) return;

        const { width } = e.currentTarget.getBoundingClientRect();

        setPosition({
          left: e.currentTarget.offsetLeft,
          width,
          opacity: 1,
        });
      }}
      className="relative z-10 block cursor-pointer px-3 py-1.5 text-xs text-white mix-blend-difference md:px-5 md:py-2 md:text-sm font-medium"
      style={{ mixBlendMode: "difference" }}
    >
        <Link href={href}>{children}</Link>
    </li>
  );
});
Tab.displayName = "Tab";

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={{
        ...position,
      }}
      className="absolute z-0 h-8 rounded-full bg-black dark:bg-white md:h-9"
    />
  );
};
