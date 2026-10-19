import * as React from "react";
import { cn } from "@/lib/utils";

/** Design System v1.0 — Module D */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[8px] border border-[#C6C8B0] bg-white px-3 py-2 text-xs text-[#151E10] transition-colors placeholder:text-[#767964]",
          "focus-visible:border-2 focus-visible:border-[#556500] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(171,198,41,0.5)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-2 aria-[invalid=true]:border-[#BA1A1A] aria-[invalid=true]:bg-[#FFDAD6]/30 aria-[invalid=true]:text-[#BA1A1A]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
