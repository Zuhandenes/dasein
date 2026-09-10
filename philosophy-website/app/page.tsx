import { Hero } from "@/components/sections/Hero";
import { ServicesShort } from "@/components/sections/ServicesShort";
import { AboutSection } from "@/components/sections/AboutSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { BookingCta } from "@/components/sections/BookingCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesShort />
      <AboutSection />
      <Testimonials />
      <BookingCta />
    </>
  );
}
