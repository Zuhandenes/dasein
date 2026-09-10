import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { env } from "@/lib/env";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const lora = Lora({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-lora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: site.domainTitle,
    template: `%s — ${site.name}`,
  },
  description: site.metaDescription,
  openGraph: {
    title: site.domainTitle,
    description: site.metaDescription,
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${lora.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
