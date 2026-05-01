/* eslint-disable @next/next/no-img-element */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export interface FaqItem {
  id: string;
  title: string;
  content: string;
  img: string;
}

export function Accordion03({ items }: { items: FaqItem[] }) {
  return (
    <div className="w-full border border-border rounded-xl bg-background/50 backdrop-blur-sm max-w-4xl mx-auto overflow-hidden">
      <Accordion type="single" defaultValue={items[0]?.id} collapsible className="w-full">
        {items.map((item) => (
          <AccordionItem className="relative border-border" value={item.id} key={item.id}>
            <AccordionTrigger className="pl-6 md:pl-8 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden py-6">
              <h1 className="text-left text-lg md:text-xl font-semibold text-foreground font-outfit">{item.title}</h1>
            </AccordionTrigger>
            <AccordionContent className="opacity-100 p-0 m-0">
              <div className="grid md:grid-cols-2 text-muted-foreground w-full gap-6 md:gap-0">
                <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 space-y-6 flex flex-col justify-center">
                  <p className="text-base leading-relaxed"> {item.content}</p>
                  <div>
                    <Button variant="outline" className="mt-2 font-medium">Read Documentation</Button>
                  </div>
                </div>
                <div className="relative w-full aspect-video md:aspect-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-background dark:from-background to-transparent md:bg-none z-10 hidden md:block w-8" />
                  <img
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    src={item.img}
                    alt={item.title}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
