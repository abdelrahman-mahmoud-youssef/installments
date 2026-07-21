import { ExternalLink, MapPin } from 'lucide-react';
import { config } from '@/lib/config';
import type { TenantLocation } from '@/lib/api/branding';

function directionsUrl(location: TenantLocation): string {
  return location.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
}

function embedUrl(address: string, apiKey: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;
}

export function ShopLocations({
  locations,
  title,
  directionsLabel,
}: {
  locations: TenantLocation[];
  title: string;
  directionsLabel: string;
}) {
  if (locations.length === 0) {
    return null;
  }

  const apiKey = config.googleMapsApiKey;

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold text-foreground">
        <MapPin className="size-4" />
        {title}
      </h2>
      <div className="space-y-3">
        {locations.map((location) => (
          <div key={location.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {apiKey && (
              <iframe
                src={embedUrl(location.address, apiKey)}
                className="h-48 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={location.name || location.address}
              />
            )}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                {location.name && <p className="truncate text-sm font-medium">{location.name}</p>}
                <p className="truncate text-xs text-muted-foreground">{location.address}</p>
              </div>
              <a
                href={directionsUrl(location)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {directionsLabel}
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
