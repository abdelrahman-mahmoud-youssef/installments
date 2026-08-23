import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
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

const localeInitScript = `(function(){try{var p=window.location.pathname;var l=(p==='/en'||p.indexOf('/en/')===0)?'en':'ar';var d=l==='ar'?'rtl':'ltr';var e=document.documentElement;e.lang=l;e.dir=d;}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexArabic.variable} ${plexMono.variable} h-full antialiased`}
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
