import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Godage Studio | Billing System",
  description: "Professional billing and POS system for Godage Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="h-full bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
