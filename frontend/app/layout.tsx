import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TopNavigation } from "./components/TopNavigation";
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
  title: "SumoVerse",
  description: "Prototype frontend for SumoVerse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-neutral-950 text-neutral-100 antialiased`}>
        <TopNavigation />
        {children}
      </body>
    </html>
  );
}
