'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateJameya } from '@/hooks/use-jameyas';
import { useJameyaValidationMessages } from '@/hooks/use-jameya-validation-messages';
import { ApiError } from '@/lib/api/client';
import { JameyaDetail } from '@/lib/api/jameyas';
import { createJameyaEditSchema, JameyaEditInput } from '@/lib/schemas/jameya';

function JameyaEditForm({ jameya, onSaved }: { jameya: JameyaDetail; onSaved: () => void }) {
  const t = useTranslations('jameyas.editDialog');
  const messages = useJameyaValidationMessages();
  const updateJameya = useUpdateJameya(jameya.id);
  const [schema] = useState(() => createJameyaEditSchema(messages));
  const form = useForm<JameyaEditInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: jameya.name, notes: jameya.notes ?? '' },
  });

  async function handleSubmit(values: JameyaEditInput) {
    try {
      await updateJameya.mutateAsync({ name: values.name, notes: values.notes ?? '' });
      toast.success(t('saved'));
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('saveError'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="space-y-4 p-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('name')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('notes')}</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter className="mx-0 mb-0 border-t border-border bg-transparent p-5">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {t('save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function JameyaEditDialog({ jameya }: { jameya: JameyaDetail }) {
  const t = useTranslations('jameyas.editDialog');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="shrink-0">
            <Pencil className="size-4" />
            {t('trigger')}
          </Button>
        }
      />
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <JameyaEditForm jameya={jameya} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
