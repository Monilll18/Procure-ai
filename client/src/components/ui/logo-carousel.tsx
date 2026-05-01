"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { TextRoll } from "./text-roll";

interface AnimatedCarouselProps {
  title?: string;
  logoCount?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  logos?: any[] | null;
  containerClassName?: string;
  titleClassName?: string;
  carouselClassName?: string;
  logoClassName?: string;
  itemsPerViewMobile?: number;
  itemsPerViewDesktop?: number;
  spacing?: string;
  padding?: string;
  logoContainerWidth?: string;
  logoContainerHeight?: string;
  logoImageWidth?: string;
  logoImageHeight?: string;
  logoMaxWidth?: string;
  logoMaxHeight?: string;
}

export const AnimatedCarousel = ({
  title = "Trusted by thousands of businesses worldwide",
  logoCount = 15,
  autoPlay = true,
  autoPlayInterval = 1000,
  logos = null,
  containerClassName = "",
  titleClassName = "",
  carouselClassName = "",
  logoClassName = "",
  itemsPerViewMobile = 4,
  itemsPerViewDesktop = 6,
  spacing = "gap-10",
  padding = "py-20 lg:py-40",
  logoContainerWidth = "w-48",
  logoContainerHeight = "h-24",
  logoImageWidth = "w-full",
  logoImageHeight = "h-full",
  logoMaxWidth = "",
  logoMaxHeight = "",
}: AnimatedCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api || !autoPlay) {
      return;
    }

    const timer = setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, autoPlayInterval);

    return () => clearTimeout(timer);
  }, [api, current, autoPlay, autoPlayInterval]);

  const logoItems = logos || Array.from({ length: logoCount }, (_, i) => `https://th.bing.com/th/id/R.4aa108082e7d3cbd55add79f84612aaa?rik=I4dbPhSe%2fbHHSg&riu=http%3a%2f%2fpurepng.com%2fpublic%2fuploads%2flarge%2fpurepng.com-google-logo-2015brandlogobrand-logoiconssymbolslogosgoogle-6815229372333mqrr.png&ehk=ewmaCOvP0Ji4QViEJnxSdlrYUrTSTWhi8nZ9XdyCgAI%3d&risl=&pid=ImgRaw&r=0100x100?text=Logo+${i + 1}`);

  const logoImageSizeClasses = `${logoImageWidth} ${logoImageHeight} ${logoMaxWidth} ${logoMaxHeight}`.trim();

  return (
    <div className={`w-full overflow-hidden ${padding} bg-background ${containerClassName}`}>
      <div className={`flex flex-col ${spacing} w-full`}>
        <div className="container mx-auto flex justify-center">
          <h2 className={`text-xl md:text-3xl tracking-tighter text-center font-medium text-muted-foreground ${titleClassName}`}>
            <TextRoll>{title}</TextRoll>
          </h2>
        </div>
        
        <div className="w-full">
          <Carousel setApi={setApi} className={`w-full ${carouselClassName}`}>
            <CarouselContent className="flex items-center">
              {logoItems.map((logo, index) => (
                <CarouselItem className={`basis-1/${itemsPerViewMobile} lg:basis-1/${itemsPerViewDesktop}`} key={index}>
                  <div className={`flex rounded-md ${logoContainerWidth} ${logoContainerHeight} items-center justify-center p-4 hover:bg-accent transition-colors ${logoClassName}`}>
                    <img 
                      src={typeof logo === 'string' ? logo : logo}
                      alt={`Logo ${index + 1}`}
                      className={`${logoImageSizeClasses} object-contain filter brightness-0 dark:brightness-0 dark:invert`}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};
