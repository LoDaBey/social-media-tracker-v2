import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { AppToaster } from "@/components/AppToaster";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ALPHAA",
  description: "Internal employee portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
