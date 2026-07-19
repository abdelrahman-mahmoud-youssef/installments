const BAR_HEIGHTS = [38, 62, 45, 80, 58, 70, 34];

export function DashboardPreview({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg ring-1 ring-foreground/5"
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger/60" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-primary p-3.5 text-primary-foreground">
            <div className="h-2 w-12 rounded-full bg-white/30" />
            <div className="mt-2.5 h-4 w-16 rounded-full bg-white/70" />
          </div>
          <div className="rounded-xl border border-border bg-background p-3.5">
            <div className="h-2 w-10 rounded-full bg-muted" />
            <div className="mt-2.5 h-4 w-8 rounded-full bg-foreground/70" />
          </div>
          <div className="rounded-xl border border-border bg-background p-3.5">
            <div className="h-2 w-10 rounded-full bg-muted" />
            <div className="mt-2.5 h-4 w-8 rounded-full bg-danger/70" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-4 h-2.5 w-28 rounded-full bg-muted" />
          <div className="flex h-24 items-end gap-2">
            {BAR_HEIGHTS.map((height, index) => (
              <div key={index} className="flex-1 rounded-t-sm bg-primary/70" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl border border-border bg-background p-4">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <span className="size-7 shrink-0 rounded-full bg-muted" />
              <div className="h-2 flex-1 rounded-full bg-muted" />
              <span className="h-2 w-10 shrink-0 rounded-full bg-success/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
