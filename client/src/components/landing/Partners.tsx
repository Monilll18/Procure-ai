"use client";

import { LogoLoop } from "@/components/ui/LogoLoop";
import { Instrument_Serif } from "next/font/google";
import { 
  SiReact, 
  SiNextdotjs, 
  SiTypescript, 
  SiTailwindcss, 
  SiStripe, 
  SiNotion, 
  SiGithub, 
  SiFigma, 
  SiFramer, 
  SiStorybook 
} from "react-icons/si";

const instrument = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-instrument",
});

const techLogos = [
  { node: <SiReact className="text-[#61DAFB]" />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs className="text-white" />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiTypescript className="text-[#3178C6]" />, title: "TypeScript", href: "https://www.typescriptlang.org" },
  { node: <SiTailwindcss className="text-[#06B6D4]" />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { node: <SiStripe className="text-[#008CDD]" />, title: "Stripe", href: "https://stripe.com" },
  { node: <SiNotion className="text-white" />, title: "Notion", href: "https://notion.so" },
  { node: <SiGithub className="text-white" />, title: "GitHub", href: "https://github.com" },
  { node: <SiFigma className="text-[#F24E1E]" />, title: "Figma", href: "https://figma.com" },
  { node: <SiFramer className="text-[#0055FF]" />, title: "Framer", href: "https://framer.com" },
  { node: <SiStorybook className="text-[#FF4785]" />, title: "Storybook", href: "https://storybook.js.org" },
];

import ScrollRevealText from "@/components/ui/ScrollRevealText";

export function Partners() {
  return (
    <section className="bg-[#010101] py-16 overflow-hidden flex flex-col items-center">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center mb-10">
          <ScrollRevealText className={`${instrument.className} text-3xl md:text-4xl font-normal text-white leading-[0.95] tracking-[-1px]`}>
            Trusted by Innovative Teams
          </ScrollRevealText>
      </div>
      <div style={{ height: "40px", width: "100%", position: "relative" }}>
        <LogoLoop
          logos={techLogos}
          speed={120}
          direction="left"
          logoHeight={32}
          gap={60}
          fadeOut
          fadeOutColor="#010101"
          scaleOnHover
        />
      </div>
    </section>
  );
}
