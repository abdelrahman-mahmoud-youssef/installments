import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/shared/logo';
import { buttonVariants } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { getTenantBrandingFromHost } from '@/lib/tenant-branding-from-host';

export default async function NotFound() {
  const branding = await getTenantBrandingFromHost();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 py-10 text-center">
      {branding && <style>{`:root{${brandColorCssVars(branding.brandColor)}}`}</style>}
      {branding && (
        <Link href="/" className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45">
          <BrandLogo logoUrl={resolveAssetUrl(branding.logoUrl)} label={branding.displayName} size="lg" />
        </Link>
      )}
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <FileQuestion aria-hidden className="size-6" strokeWidth={1.9} />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-headline font-semibold tracking-tight">Page not found</h1>
        <p className="mx-auto max-w-md text-lead text-muted-foreground">
          This link is invalid or no longer available.
        </p>
      </div>
      <Link href="/" className={buttonVariants({ size: 'xl' })}>
        Back home
      </Link>
    </div>
  );
}
