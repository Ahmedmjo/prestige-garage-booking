import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Prestige Garage AI-OS | نظام إدارة مركز برستيج جراج",
  description: "نظام إدارة ذكي داخلي لمركز Prestige Garage للعناية بالسيارات الفاخرة — مع مساعد ذكي AI متكامل",
  keywords: ["Prestige Garage", "إدارة ورشة", "PPF", "ديتيلنج", "AI Assistant", "بروتيكشن"],
  authors: [{ name: "Prestige Garage" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Prestige Garage AI-OS",
    description: "نظام إدارة ذكي لمركز العناية بالسيارات الفاخرة",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
