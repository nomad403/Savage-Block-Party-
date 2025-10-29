import type { Metadata } from "next";
import Image from "next/image";
import StoryOverlay, { AccrocheText, TextBlock } from "@/components/story-overlay";

export const metadata: Metadata = {
  title: "Story — Savage Block Party",
};

export default function StoryPage() {
  return (
    <main id="story-root" className="w-full -mt-20">
      {/* Section 1: Accroche */}
      <section className="h-screen w-full relative">
        <Image
          src="/story/images/FILTRE PHOTO 16-92.png"
          alt="Story image 1"
          fill
          className="object-cover"
          priority
        />
        <StoryOverlay>
          <AccrocheText text="Par nous, pour nous." />
        </StoryOverlay>
      </section>

      {/* Section 2: Qui sommes-nous */}
      <section className="h-screen w-full relative">
        <Image
          src="/story/images/FILTRE PHOTO 16-9-4.png"
          alt="Story image 2"
          fill
          className="object-cover"
        />
        <StoryOverlay className="justify-center items-center px-8 md:px-16">
          <div className="w-full max-w-6xl flex justify-start">
            <div className="max-w-md">
              <TextBlock 
                title="Qui sommes-nous ?"
                description="Née dans les marges, Savage Block Party fait vibrer les lieux que la ville oublie, les friches, les rails, les bois, les parkings, en y ramenant la vie, le son et la lumière. Nos événements rassemblent DJs, danseurs, photographes et performeurs venus de tous horizons, unis par une même énergie brute, libre et humaine. Chaque soirée devient un manifeste, un moment où la culture underground reprend sa place, où la fête devient un langage, et où la communauté écrit, nuit après nuit, l'histoire vivante de l'underground parisien et plus."
                className="text-left"
              />
            </div>
          </div>
        </StoryOverlay>
      </section>

      {/* Section 3: L'équipe */}
      <section className="h-screen w-full relative">
        <Image
          src="/story/images/FILTRE PHOTO 16-9-6.png"
          alt="Story image 3"
          fill
          className="object-cover"
        />
        <StoryOverlay className="justify-center items-center px-8 md:px-16">
          <div className="w-full max-w-6xl flex justify-end">
            <div className="max-w-md">
              <TextBlock 
                title="L'équipe"
                description="Notre équipe est composée de Vins Crespo, créateur de la Savage et danseur professionnel, Niel DJ, Philipinne, Bilal, HAX, Saki, Rita amoureux, Le sympathique, Queen2 et SUNGOMA DJ. Chacun apporte sa créativité et son expertise pour créer des moments uniques où la musique et la danse se rencontrent dans une explosion d'énergie pure."
                className="text-left"
              />
            </div>
          </div>
        </StoryOverlay>
      </section>
    </main>
  );
}


