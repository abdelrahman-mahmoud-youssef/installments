import { Almarai, Cairo, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Noto_Sans_Arabic, Tajawal } from "next/font/google";
import Script from "next/script";
import { fontSizeInitScript } from "@/lib/font-size";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-ar",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  weight: ["400", "500", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const almarai = Almarai({
  variable: "--font-almarai",
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
  preload: false,
});

const localeInitScript = `(function(){try{var p=window.location.pathname;var l=(p==='/en'||p.indexOf('/en/')===0)?'en':'ar';var d=l==='ar'?'rtl':'ltr';var e=document.documentElement;e.lang=l;e.dir=d;}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexArabic.variable} ${plexMono.variable} ${cairo.variable} ${tajawal.variable} ${notoSansArabic.variable} ${almarai.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Script id="locale-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <Script id="theme-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Script
          id="font-size-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: fontSizeInitScript }}
        />
        {children}
      </body>
    </html>
  );
}
