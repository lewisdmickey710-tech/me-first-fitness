import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeFirstFitness",
  description: "Mind & Muscle Mechanics — coaching, made personal.",
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
      </body>
    </html>
  );
}
