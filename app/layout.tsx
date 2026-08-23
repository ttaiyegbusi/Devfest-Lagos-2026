import type { Metadata, Viewport } from "next";
import { Reveal } from "./motion/Reveal";
import "./globals.css";

const title = "DevFest Lagos — One Ecosystem, Endless Opportunities.";
const description =
  "Join the largest annual tech conference in Africa, hosted by Google Developer Group Lagos (GDG Lagos).";

/* Share cards need absolute URLs, and only the deployment knows what the host
   is. Set NEXT_PUBLIC_SITE_URL at build time; without it the tags still render,
   they just point at localhost, which is fine in development and wrong in
   production. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* The icon, the apple touch icon and the share image are picked up by filename
   from this directory — app/icon.svg, app/apple-icon.png, app/opengraph-image.png
   (with its alt text alongside) — so none of them are listed here. */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "DevFest Lagos",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DevFest Lagos",
    title,
    description,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  /* Tints the browser chrome on Android to the hero's own background. */
  themeColor: "#fff5d4",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Stamps <html data-motion> before the first paint, which is what the
            reveal stylesheet keys its hidden state on. It has to run here, not
            in an effect: hiding the page after it has already been painted is
            a visible collapse, and the point of the reveal is that the reader
            never sees the laid-out state it starts from.

            Two ways it declines to stamp, and both leave the page complete
            rather than degraded: no scripting at all, so nothing ever hides;
            and prefers-reduced-motion, which is why the stylesheet carries no
            reduced-motion rule of its own — there is nothing to undo. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)' +
              'document.documentElement.dataset.motion="on"}catch(e){}',
          }}
        />
      </head>
      <body>
        {/* First thing in the tab order: the hero carries a nav, an illustration
            and a search control before the page proper begins. */}
        <a className="skip" href="#main">
          Skip to content
        </a>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Reveal />
      </body>
    </html>
  );
}
