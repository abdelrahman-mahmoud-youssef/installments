import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/app-providers";
import { config } from "@/lib/config";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    metadataBase: new URL(config.siteUrl),
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("appDescription"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("appName"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider>
      <AppProviders locale={locale} direction={direction}>
        {children}
        <Toaster />
      </AppProviders>
    </NextIntlClientProvider>
  );
}
