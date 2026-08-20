import { Hero } from "./hero/Hero";
import { Expect } from "./expect/Expect";
import { Speakers } from "./speakers/Speakers";
import { Faq } from "./faq/Faq";
import { SiteFooter } from "./footer/SiteFooter";

export default function Page() {
  return (
    <>
      <Hero />
      <Expect />
      <Speakers />
      <Faq />
      <SiteFooter />
    </>
  );
}
