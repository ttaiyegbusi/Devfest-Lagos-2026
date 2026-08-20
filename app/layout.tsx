import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevFest Lagos — One Ecosystem, Endless Opportunities.",
  description:
    "Join the largest annual tech conference in Africa, hosted by Google Developer Group Lagos (GDG Lagos).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
