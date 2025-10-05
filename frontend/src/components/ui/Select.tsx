"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

/** util รวม class แบบเบา ๆ */
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/* ========== re-export ที่จำเป็น ========== */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectLabel = SelectPrimitive.Label;
export const SelectPortal = SelectPrimitive.Portal;
export const SelectSeparator = SelectPrimitive.Separator;
export const SelectScrollUpButton = SelectPrimitive.ScrollUpButton;
export const SelectScrollDownButton = SelectPrimitive.ScrollDownButton;

/* ========== Trigger ========== */
export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    className?: string;
    disabled?: boolean; // ✅ รองรับ disabled
  }
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      {...props}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm",
        "ring-offset-background placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

/* ========== Content ========== */
export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    className?: string;
  }
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPortal>
      <SelectPrimitive.Content
        ref={ref}
        sideOffset={8}
        position={position}
        // ⬇️ ปรับคลาสตรงนี้
        className={[
          "z-50 min-w-[12rem] overflow-hidden rounded-md",
          // พื้นทึบสำหรับทุกธีม (fallback) + รองรับ dark
          "bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-100",
          // เส้นขอบ/เงา
          "border border-slate-200 dark:border-slate-700 shadow-xl",
          // viewport padding เมื่อใช้ popper
          position === "popper" ? "p-0" : "",
          className || "",
        ].join(" ")}
        {...props}
      >
        <SelectScrollUpButton className="flex items-center justify-center py-1">
          <ChevronUp className="h-4 w-4" />
        </SelectScrollUpButton>

        <SelectPrimitive.Viewport className={position === "popper" ? "p-1" : ""}>
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton className="flex items-center justify-center py-1">
          <ChevronDown className="h-4 w-4" />
        </SelectScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPortal>
  );
});


/* ========== Item ========== */
export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    className?: string;
    disabled?: boolean; // ✅ รองรับ disabled
  }
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      {...props}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
