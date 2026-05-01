import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface FaqItem {
  id: string;
  title: string;
  content: string;
}

export function Accordion05({ items }: { items: FaqItem[] }) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Accordion type="single" defaultValue={items[0]?.id} collapsible className="w-full">
        {items.map((item) => (
          <AccordionItem value={item.id} key={item.id} className="last:border-b-0 border-border/50">
            <AccordionTrigger className="text-left pl-2 md:pl-6 overflow-hidden text-foreground/40 duration-300 hover:no-underline cursor-pointer -space-y-6 data-[state=open]:space-y-0 data-[state=open]:text-primary [&>svg]:hidden">
              <div className="flex flex-1 items-start gap-4 md:gap-8">
                <p className="text-sm md:text-base font-medium mt-2">{item.id}</p>
                <h1
                  className={`uppercase relative text-left text-2xl md:text-4xl lg:text-5xl font-outfit tracking-tight leading-none`}
                >
                  {item.title}
                </h1>
              </div>
            </AccordionTrigger>

            <AccordionContent className="text-muted-foreground pb-8 pl-10 md:pl-20 text-base md:text-lg max-w-3xl leading-relaxed">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
