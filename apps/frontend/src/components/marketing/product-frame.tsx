import Image, { type StaticImageData } from 'next/image';
import { cn } from '@/lib/utils';

const PHONE_IMAGE_SIZES = '(min-width: 1024px) 20rem, 18rem';

export function ProductFrame({
  image,
  label,
  className,
  children,
}: {
  image?: { src: StaticImageData | string; alt: string };
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <figure
      aria-label={label}
      className={cn(
        'relative mx-auto w-full max-w-[18rem] rounded-[2.6rem] bg-ink p-2.5 shadow-xl ring-1 ring-ink/10 lg:max-w-[20rem]',
        className,
      )}
    >
      <div aria-hidden className="absolute inset-x-0 top-4 mx-auto h-1.5 w-16 rounded-full bg-ink-foreground/15" />
      <div className="relative aspect-[9/17] overflow-hidden rounded-[2.1rem] bg-background">
        {image ? (
          <Image src={image.src} alt={image.alt} fill sizes={PHONE_IMAGE_SIZES} className="object-cover object-top" />
        ) : (
          children
        )}
      </div>
    </figure>
  );
}
