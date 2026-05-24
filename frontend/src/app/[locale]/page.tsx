import { HeroCarousel } from '@/components/sections/HeroCarousel';
import { StatsSection } from '@/components/sections/StatsSection';
import { ProgramGrid } from '@/components/sections/ProgramGrid';
import { EventCards } from '@/components/sections/EventCards';
import { TestimonialCarousel } from '@/components/sections/TestimonialCarousel';
import { NewsGrid } from '@/components/sections/NewsGrid';

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <StatsSection />
      <ProgramGrid />
      <EventCards />
      <TestimonialCarousel />
      <NewsGrid />
    </>
  );
}
