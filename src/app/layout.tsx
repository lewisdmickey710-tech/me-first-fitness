import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/register-service-worker";

export const metadata: Metadata = {
  title: "MeFirstFitness",
  description: "Mind & Muscle Mechanics — coaching, made personal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MeFirstFitness",
  },
};

export const viewport: Viewport = {
  themeColor: "#B9829A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
