import type { Metadata } from "next";
import { fontVariables } from "@/src/shared/config/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWSSBG-UC",
  description: "AWS Student Builders Group — University of Cabuyao",
  icons: {
    icon: "/icons/logo.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-neutral-900 font-sans text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
