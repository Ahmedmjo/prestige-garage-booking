import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Prestige Garage | Premium Car Care",
  description:
    "Prestige Garage — Premium Car Care. Born in Germany. Mastered in Egypt. Authorized SONAX Dealer. Book your detailing, wash, ceramic coating and more.",
  keywords: [
    "Prestige Garage",
    "car care",
    "detailing",
    "SONAX",
    "ceramic coating",
    "car wash Egypt",
    "ديتيلنج",
    "غسيل سيارات",
    "سيراميك",
    "بريستيج جاراج",
  ],
  authors: [{ name: "Prestige Garage" }],
  manifest: "/manifest.json",
  applicationName: "Prestige Garage",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prestige Garage",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Prestige Garage | Premium Car Care",
    description: "Born in Germany. Mastered in Egypt. Authorized SONAX Dealer.",
    siteName: "Prestige Garage",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/images/33562fbd-0491-47ac-9773-54319394fa7f.png", sizes: "192x192", type: "image/png" },
      { url: "/images/33562fbd-0491-47ac-9773-54319394fa7f.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/images/33562fbd-0491-47ac-9773-54319394fa7f.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" theme="dark" />
      </body>
    </html>
  );
}
