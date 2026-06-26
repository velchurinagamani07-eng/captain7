import { PageTransition } from "../components/common/PageTransition.jsx";
import { HeroSlider } from "../components/home/HeroSlider.jsx";
import { StatsBar } from "../components/home/StatsBar.jsx";
import { CricketCTA } from "../components/home/CricketCTA.jsx";
import { FoodShowcase } from "../components/home/FoodShowcase.jsx";
import { PartyPreview } from "../components/home/PartyPreview.jsx";
import { ReviewWidget } from "../components/home/ReviewWidget.jsx";
import { FestivalBanner } from "../components/home/FestivalBanner.jsx";
import { FranchiseSection } from "../components/home/FranchiseSection.jsx";
import { CategoryCards } from "../components/home/CategoryCards.jsx";
import { GalleryPreview } from "../components/home/GalleryPreview.jsx";

export default function Home() {
  return (
    <PageTransition>
      <HeroSlider pageKey="home" />
      <CategoryCards />
      <FestivalBanner />
      <StatsBar />
      <FoodShowcase />
      <CricketCTA />
      <GalleryPreview />
      <PartyPreview />
      <ReviewWidget />
      <FranchiseSection />
    </PageTransition>
  );
}
