import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Radio } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

function hrefFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const href = (payload as Record<string, unknown>).href;
  return typeof href === "string" && href.length ? href : null;
}

export default async function AdminActivityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin/activity");
  if (user.role !== "SUPER_ADMIN") redirect("/login");

  const events = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 animate-pulse rounded-full bg-primary-container" />
            <span>Platform Control Center • Event stream</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            Live timeline
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Every shipper load, carrier bid, award, transit, and delivery event —
            click any row to open the related detail.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          <Radio className="size-4 text-primary" />
          <span>{events.length} recent events</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-card shadow-sm">
        {!events.length ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <Activity className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No platform events yet. When shippers publish or carriers bid, they
              appear here.
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {events.map((n, i) => {
              const href = hrefFromPayload(n.payload) || "/admin/loads";
              return (
                <li key={n.id}>
                  <Link
                    href={href}
                    className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-surface-high sm:gap-4"
                  >
                    <div className="flex w-8 shrink-0 flex-col items-center">
                      <span className="mt-1.5 size-2.5 rounded-full bg-primary-container ring-4 ring-primary-container/20" />
                      {i < events.length - 1 ? (
                        <span className="mt-1 w-px flex-1 bg-border" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <time className="shrink-0 text-[11px] text-muted-foreground">
                          {n.createdAt.toLocaleString("de-DE")}
                        </time>
                      </div>
                      {n.body ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
