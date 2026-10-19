import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Design System v1.0 — Module C */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(171,198,41,0.5)] disabled:pointer-events-none disabled:opacity-70 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[#8FA622] bg-[#ABC629] text-[#151E10] shadow-sm hover:bg-[#8FA622] active:bg-[#556500] active:text-white",
        secondary:
          "border border-[#C6C8B0] bg-white text-[#151E10] hover:border-[#767964] hover:bg-[#F1FDE5]",
        outline:
          "border border-[#C6C8B0] bg-white text-[#151E10] hover:border-[#767964] hover:bg-[#F1FDE5]",
        ghost:
          "text-[#454836] hover:bg-[#E6F2DA] hover:text-[#151E10]",
        destructive:
          "border border-[#BA1A1A]/30 bg-[#FFDAD6] text-[#BA1A1A] hover:bg-[#BA1A1A] hover:text-white",
        link: "text-[#556500] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-8 px-3.5 py-2",
        lg: "h-11 px-5 py-3 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
