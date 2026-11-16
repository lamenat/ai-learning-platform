import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Учебная платформа ГПОУ ЧПТК",
  description:
    "Учебная платформа Читинского политехнического колледжа: курсы, уроки, тесты и персональный план обучения.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="light">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
