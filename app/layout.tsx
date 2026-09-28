import type { Metadata, Viewport } from "next";
import { Reveal } from "./motion/Reveal";
import { FloatingAskButton } from "./chat/FloatingAskButton";
import "./globals.css";

const title = "DevFest Lagos — One Ecosystem, Endless Opportunities.";
const description =
  "Join the largest annual tech conference in Africa, hosted by Google Developer Group Lagos (GDG Lagos).";

/* Share cards need absolute URLs, and only the deployment knows what the host
   is. Three sources, most specific first:

   NEXT_PUBLIC_SITE_URL is the override, and the only one to set once there is
   a custom domain — a real domain is worth more in a shared link than a
   generated one, and nothing else here can know it.

   Failing that, Vercel says so itself. VERCEL_PROJECT_PRODUCTION_URL is the
   project's production host and is set on every deployment, previews included
   — which is what we want, because a card shared out of a preview should still
   point at the live site. VERCEL_URL, the per-deployment host, stands in on
   the rare deployment that has no production domain yet. Neither carries a
   scheme. Neither needs the NEXT_PUBLIC_ prefix either: `metadata` is only
   ever evaluated on the server, so these are read at build time and never
   reach the browser.

   Only then localhost, which is right in development and wrong anywhere else:
   a link posted to Slack or WhatsApp with a localhost image renders no
   preview at all. */
const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

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
  /* Tints the browser chrome on Android to the hero's own background — so the
     light switch in app/hero/HeroTheme.tsx rewrites this at runtime, and keeps
     its own copy of the value. Change one, change the other. */
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
            reduced-motion rule of its own — there is nothing to undo.

            The second stamp is the hero's remembered light switch, and it is
            here for the same reason: a reader who left the hero dark should
            not be shown a frame of cream before React has loaded. Two separate
            try blocks, because a browser that refuses site data would
            otherwise take the reveals down with the theme. The key is the one
            in app/hero/HeroTheme.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)' +
              'document.documentElement.dataset.motion="on"}catch(e){}' +
              'try{if(localStorage.getItem("devfest:hero-theme")==="dark")' +
              'document.documentElement.dataset.heroTheme="dark"}catch(e){}',
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
        <FloatingAskButton />
        <Reveal />
      </body>
    </html>
  );
}
