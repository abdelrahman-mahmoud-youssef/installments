import { Upload } from 'lucide-react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImagePreviewDialog } from '@/components/shared/image-preview-dialog';
import { resolveAssetUrl } from '@/lib/assets';

export function ImageUploadSlot<T extends FieldValues>({
  form,
  name,
  label,
  uploadLabel,
  existingUrl,
  pickedName,
  onPickedNameChange,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  uploadLabel: string;
  existingUrl: string | null | undefined;
  pickedName: string | null;
  onPickedNameChange: (name: string | null) => void;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { value: _value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {existingUrl && !pickedName && (
            <ImagePreviewDialog
              src={resolveAssetUrl(existingUrl) ?? ''}
              alt={label}
              trigger={
                <button type="button" className="block">
                  <img
                    src={resolveAssetUrl(existingUrl) ?? undefined}
                    alt={label}
                    className="h-20 rounded-lg border border-border object-cover"
                  />
                </button>
              }
            />
          )}
          <FormControl>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border p-3.5 text-sm text-muted-foreground transition-colors hover:bg-accent">
              <Upload className="size-4 shrink-0" />
              <span className="truncate">{uploadLabel}</span>
              <input
                {...field}
                type="file"
                accept="image/*"
                className="hidden"
                value={undefined}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  onChange(file ?? undefined);
                  onPickedNameChange(file?.name ?? null);
                }}
              />
            </label>
          </FormControl>
          {pickedName && <p className="truncate text-xs text-muted-foreground">{pickedName}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
