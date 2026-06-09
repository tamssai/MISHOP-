import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phoenix Sénégal — Portail RH",
  description: "Portail RH Phoenix - Cartographie des sites et agents",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
