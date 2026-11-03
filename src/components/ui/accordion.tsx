"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "cn";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-3 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  const reduce = useReducedMotion();
  return (
    <AccordionPrimitive.Panel
      keepMounted
      data-slot="accordion-content"
      className="overflow-hidden text-sm"
      {...props}
      render={(panelProps, state) => {
        // Alasan lib: handler drag/animation DOM base-ui bentrok tipe dengan Motion → buang.
        // hidden bawaan dibuang: visibilitas diatur Motion (height/opacity) + inert.
        const {
          onAnimationEnd: _ae,
          onAnimationIteration: _ai,
          onAnimationStart: _as,
          onDrag: _d,
          onDragEnd: _de,
          onDragEnter: _den,
          onDragLeave: _dl,
          onDragOver: _do,
          onDragStart: _ds,
          onDrop: _dd,
          hidden: _h,
          ...safeProps
        } = panelProps;
        return (
          <motion.div
            {...safeProps}
            inert={!state.open}
            initial={false}
            animate={{ height: state.open ? "auto" : 0, opacity: state.open ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "pt-0 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
                className,
              )}
            >
              {children}
            </div>
          </motion.div>
        );
      }}
    />
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
