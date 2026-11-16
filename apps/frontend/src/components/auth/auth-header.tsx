export function AuthHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2.5">
      <h1 className="font-heading text-[1.75rem] leading-tight font-semibold tracking-tight text-balance sm:text-[2rem] rtl:leading-snug rtl:tracking-normal">
        {title}
      </h1>
      <p className="leading-relaxed text-pretty text-muted-foreground">{description}</p>
    </div>
  );
}
