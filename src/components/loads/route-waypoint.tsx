/** Stitch-style pickup → delivery waypoint micro-tracker */
export function RouteWaypoint({
  from,
  to,
  fromMeta,
  toMeta,
}: {
  from: string;
  to: string;
  fromMeta?: string;
  toMeta?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-1 flex flex-col items-center">
        <span className="size-2 rounded-full bg-foreground" />
        <span className="my-0.5 h-6 w-px border-l border-dashed border-border" />
        <span className="size-2 rounded-sm bg-primary-container" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">
            {from}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">(DE)</span>
          </span>
          {fromMeta ? (
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              {fromMeta}
            </span>
          ) : null}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">
            {to}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">(EU)</span>
          </span>
          {toMeta ? (
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              {toMeta}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
