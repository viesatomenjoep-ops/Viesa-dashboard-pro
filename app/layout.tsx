import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
// Merk-font voor de 'Viesa Automations'-wordmark. Vervang later door je eigen
// lettertype via next/font/local (zie public/fonts).
const merk = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-merk",
});

export const metadata: Metadata = {
  title: "Viesa Dashboard",
  description: "Intern administratie- en salesdashboard voor Viesa Automations",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Viesa DB",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
    <html lang="nl" className={merk.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
