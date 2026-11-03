'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Reply } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { PlatformSupportMessage, useReplyToPlatformSupportMessage } from '@/hooks/use-platform-support';
import { ApiError } from '@/lib/api/client';
import { SupportReplyInput, supportReplySchema } from '@/lib/schemas/platform-support';

export function SupportReplyDialog({ message }: { message: PlatformSupportMessage }) {
  const t = useTranslations('platform.support');
  const [open, setOpen] = useState(false);
  const replyToMessage = useReplyToPlatformSupportMessage();
  const form = useForm<SupportReplyInput>({
    resolver: zodResolver(supportReplySchema),
    defaultValues: { reply: message.adminReply ?? '' },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      form.reset({ reply: message.adminReply ?? '' });
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(values: SupportReplyInput) {
    try {
      await replyToMessage.mutateAsync({ messageId: message.id, reply: values.reply });
      toast.success(t('replySent', { name: message.tenant.name }));
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" variant={message.adminReply ? 'outline' : 'default'}>
            <Reply className="size-4" />
            {message.adminReply ? t('editReply') : t('reply')}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('replyTitle', { name: message.tenant.name })}</DialogTitle>
          <DialogDescription className="line-clamp-2">{message.subject}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="reply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('replyLabel')}</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {form.formState.isSubmitting ? t('sending') : t('sendReply')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
