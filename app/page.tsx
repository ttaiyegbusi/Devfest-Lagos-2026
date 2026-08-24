import { Suspense } from "react";
import { Stack } from "./stack/Stack";
import { Hero } from "./hero/Hero";
import { expectPanels } from "./expect/panels";
import { Pricing } from "./pricing/Pricing";
import { Speakers } from "./speakers/Speakers";
import { Faq } from "./faq/Faq";
import { Sponsors } from "./sponsors/Sponsors";
import { SiteFooter } from "./footer/SiteFooter";

export default function Page() {
  return (
    <>
      {/* The hero is the stack's first pinned layer, which is what gives panel
          01 something to rise over. */}
      <Stack>
        <Hero />
        {expectPanels()}
      </Stack>
      {/* Straight after the four panels: the reader now knows what the day
          is, and the price is the next thing they ask. */}
      <Pricing />
      <Speakers />
      {/* The FAQ reads ?q= from the URL, which a statically prerendered page
          has to reach through a Suspense boundary. */}
      <Suspense>
        <Faq />
      </Suspense>
      {/* Credits, so they sit below the content and above the footer. */}
      <Sponsors />
      <SiteFooter />
    </>
  );
}
