import { cn } from "@/lib/utils";

/** Flat geometric mark — brand green, not photo/AI art. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-9 w-9", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="#ABC629" />
      <path
        d="M8 22h10l4-8h10"
        fill="none"
        stroke="#1A1F16"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="28" r="3" fill="#1A1F16" />
      <circle cx="28" cy="28" r="3" fill="#1A1F16" />
    </svg>
  );
}
