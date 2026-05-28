import { HeroCarousel } from '@/components/sections/HeroCarousel';
import { StatsSection } from '@/components/sections/StatsSection';
import { ProgramGrid } from '@/components/sections/ProgramGrid';
import { EventCards } from '@/components/sections/EventCards';
import { NewsGrid } from '@/components/sections/NewsGrid';
import { CTABanner } from '@/components/sections/CTABanner';

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <StatsSection />
      <ProgramGrid />
      <EventCards />
      <NewsGrid />
      <CTABanner />
    </>
  );
}
