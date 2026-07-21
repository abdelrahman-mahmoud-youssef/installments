'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useCreateStaff, useSetStaffActive, useStaff } from '@/hooks/use-staff';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { CreateStaffInput, createStaffSchema } from '@/lib/schemas/staff';

function AddStaffDialog() {
  const t = useTranslations('staff');
  const [open, setOpen] = useState(false);
  const createStaff = useCreateStaff();

  const form = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { email: '', password: '' },
  });

  async function handleSubmit(values: CreateStaffInput) {
    try {
      await createStaff.mutateAsync(values);
      toast.success(t('staffCreated'));
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          form.reset();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            {t('addStaff')}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addStaffTitle')}</DialogTitle>
          <DialogDescription>{t('addStaffDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('staffEmail')}</FormLabel>
                  <FormControl>
                    <Input type="email" dir="ltr" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('staffTempPassword')}</FormLabel>
                  <FormControl>
                    <Input type="text" dir="ltr" autoComplete="off" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t('staffTempPasswordHint')}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {form.formState.isSubmitting ? t('saving') : t('addStaff')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffPage() {
  const t = useTranslations('staff');
  const locale = useLocale();
  const { data: staff, isLoading } = useStaff();
  const setStaffActive = useSetStaffActive();

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await setStaffActive.mutateAsync({ id, isActive });
      toast.success(t('statusUpdated'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} actions={<AddStaffDialog />} />
      </FadeIn>

      <FadeIn delay={0.05} className="mx-auto w-full max-w-2xl">
        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : !staff || staff.length === 0 ? (
          <EmptyState icon={Users} title={t('noStaffYet')} compact />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="divide-y divide-border">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <p dir="ltr" className="truncate text-left text-sm font-medium">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('staffCreatedAt', { date: formatDate(member.createdAt, locale) })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={member.isActive ? 'secondary' : 'outline'}>
                      {member.isActive ? t('staffActive') : t('staffInactive')}
                    </Badge>
                    <Switch
                      checked={member.isActive}
                      onCheckedChange={(next) => handleToggleActive(member.id, next)}
                      disabled={setStaffActive.isPending}
                      aria-label={t('staffActive')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
