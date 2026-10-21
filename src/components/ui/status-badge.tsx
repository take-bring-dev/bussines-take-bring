import { cn } from "@/lib/utils";
import { formatStatus } from "@/lib/format";

/** Design System v1.0 — Module E (chip + text) */
const STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  PUBLISHED: "bg-[#E6F2DA] border-[#556500] text-[#556500]",
  RECEIVING_OFFERS: "bg-[#D3EF51] border-[#ABC629] text-[#151E10]",
  OFFER_SELECTED: "bg-[#D3EF51] border-[#ABC629] text-[#151E10]",
  ASSIGNED: "bg-[#E6F2DA] border-[#556500] text-[#556500]",
  IN_TRANSIT: "bg-[#E6F2DA] border-[#556500] text-[#556500]",
  DELIVERED: "bg-[#D1E8D5] border-[#2C6A3D] text-[#2C6A3D]",
  CANCELLED: "bg-[#FFDAD6] border-[#BA1A1A] text-[#BA1A1A]",
  EXPIRED: "bg-[#FFDAD6] border-[#BA1A1A] text-[#BA1A1A]",
  PENDING: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  ACCEPTED: "bg-[#D1E8D5] border-[#2C6A3D] text-[#2C6A3D]",
  REJECTED: "bg-[#FFDAD6] border-[#BA1A1A] text-[#BA1A1A]",
  SUBMITTED: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  UNDER_REVIEW: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  APPROVED: "bg-[#D1E8D5] border-[#2C6A3D] text-[#2C6A3D]",
  ACTIVE: "bg-[#D1E8D5] border-[#2C6A3D] text-[#2C6A3D]",
  SUSPENDED: "bg-[#FFDAD6] border-[#BA1A1A] text-[#BA1A1A]",
  DELETED: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  INVITED: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  MAINTENANCE: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  INACTIVE: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  AWAITING_PAYMENT: "bg-[#ECF8DF] border-[#767964] text-[#454836]",
  AUTHORIZED: "bg-[#E6F2DA] border-[#556500] text-[#556500]",
  CAPTURED: "bg-[#D1E8D5] border-[#2C6A3D] text-[#2C6A3D]",
  RELEASED: "bg-[#D1E8D5] border-[#2C6A3D] text-[#2C6A3D]",
  REFUNDED: "bg-[#FFDAD6] border-[#BA1A1A] text-[#BA1A1A]",
};

const PULSE = new Set(["RECEIVING_OFFERS", "PUBLISHED"]);

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const pulse = PULSE.has(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold",
        STATUS_CLASS[status] || "bg-[#ECF8DF] border-[#C6C8B0] text-[#454836]",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full bg-current",
          pulse && "animate-pulse",
        )}
      />
      {formatStatus(status)}
    </span>
  );
}
