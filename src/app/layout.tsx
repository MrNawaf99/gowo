import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/layout/LanguageProvider";

export const metadata: Metadata = {
  title: "GoWord Academy",
  description: "Learn Grammar the Easy Way",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground font-sans">
        <LanguageProvider initialLocale={locale}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
