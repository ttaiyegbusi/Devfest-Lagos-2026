import { Suspense } from "react";
import { Stack } from "./stack/Stack";
import { Hero } from "./hero/Hero";
import { expectPanels } from "./expect/panels";
import { Speakers } from "./speakers/Speakers";
import { Faq } from "./faq/Faq";
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
      <Speakers />
      {/* The FAQ reads ?q= from the URL, which a statically prerendered page
          has to reach through a Suspense boundary. */}
      <Suspense>
        <Faq />
      </Suspense>
      <SiteFooter />
    </>
  );
}
