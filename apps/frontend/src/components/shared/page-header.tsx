export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="font-heading text-[1.65rem] leading-tight font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <div className="text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a:hover]:underline">
            {description}
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
