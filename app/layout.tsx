import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viesa Command Center",
  description: "Intern administratie- en salesdashboard voor Viesa Automations",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Viesa",
  },
  icons: {
    icon: "/viesa-logo.png",
    apple: "/viesa-logo.png",
  },
};

export const viewport = {
  themeColor: "#19445B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
