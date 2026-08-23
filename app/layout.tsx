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
      <body>
        {/* First thing in the tab order: the hero carries a nav, an illustration
            and a search control before the page proper begins. */}
        <a className="skip" href="#main">
          Skip to content
        </a>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
