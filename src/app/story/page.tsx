"use client";

import Image from "next/image";
import StoryOverlay, { AccrocheText, TextBlock } from "@/components/story-overlay";
import { useMenu } from "@/hooks/useMenu";

// Styles pour l'animation de défilement du texte
const scrollTextStyle = `
  @keyframes scroll-text {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-33.333%);
    }
  }
  
  .animate-scroll-text {
    animation: scroll-text 15s linear infinite;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('story-scroll-styles')) {
  const style = document.createElement('style');
  style.id = 'story-scroll-styles';
  style.textContent = scrollTextStyle;
  document.head.appendChild(style);
}

export default function StoryPage() {
  const { isMenuOpen } = useMenu();

  // Tous les talents mélangés
  const allTalents = [
    'Rita Amoureux', 'Woodneymo', 'HAX', 'Bengala', 'Niel', 'Darlean', 'Le Sympathique', 'Sungoma',
    'Ambre', 'Vins Crespo', 'Milliard', 'Morgane', 'Rocket'
  ];

  // Les 10 commandements de la Savage
  const commandments = [
    "DANS UNE BOUTEILLE EN PLASTIQUE, TON BREUVAGE TU RAMÈNERAS.",
    "LE GARDIEN DE TON FRÈRE TU SERAS, SUR TOUT LE MONDE TU VEILLERAS.",
    "LA LOCALISATION POUR TOI ET TON GROUPE D'AMIS TU GARDERAS.",
    "COMME TU ES TU VIENDRAS. DANS UN TROU, UN GRILLAGE, COMME TOUT LE MONDE, TU PASSERAS.",
    "AUX ABORDS DU LIEU, DISCRET TU RESTERAS.",
    "LE LIEU TU RESPECTERAS, DANS UNE POUBELLE TES DÉCHETS TU JETTERAS.",
    "TOUT COMPORTEMENT IRRESPECTUEUX (BAGARRES, ATTOUCHEMENTS) : LA SORTIE TU PRENDRAS.",
    "LES OBJETS TROUVÉS À L'ORGA TU RAMÈNERAS.",
    "TES AMIS TU AVERTIRAS ET TON DÉPART DE LA SOIRÉE TU PRÉVOIRAS.",
    "EN CAS DE PROBLÈMES, UN SAVER (ORGA) TU PRÉVIENDRAS."
  ];

  return (
    <main id="story-root" className="w-full -mt-32">
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

      {/* Bannière commandements défilant */}
      <section className="w-full bg-yellow-400 text-black py-4 relative overflow-hidden">
        <div className={`flex flex-col items-center justify-center h-full gap-12 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Texte défilant */}
          <div className="flex items-center gap-8 whitespace-nowrap animate-scroll-text w-full">
            {commandments.map((commandment, i) => (
              <span key={`banner1-${i}`} className="font-title uppercase text-4xl sm:text-5xl md:text-6xl text-black">{commandment}</span>
            ))}
            {commandments.map((commandment, i) => (
              <span key={`banner1-repeat-${i}`} className="font-title uppercase text-4xl sm:text-5xl md:text-6xl text-black">{commandment}</span>
            ))}
            {commandments.map((commandment, i) => (
              <span key={`banner1-repeat2-${i}`} className="font-title uppercase text-4xl sm:text-5xl md:text-6xl text-black">{commandment}</span>
            ))}
          </div>
        </div>
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
            <TextBlock 
              title="Qui sommes-nous ?"
              description={[
                "Née dans les marges, Savage Block Party fait vibrer les lieux que la ville oublie, les friches, les rails, les bois, les parkings, en y ramenant la vie, le son et la lumière.",
                "Nos événements rassemblent DJs, danseurs, photographes et performeurs venus de tous horizons, unis par une même énergie brute, libre et humaine.",
                "Chaque soirée devient un manifeste, un moment où la culture underground reprend sa place, où la fête devient un langage, et où la communauté écrit, nuit après nuit, l'histoire vivante de l'underground parisien et plus."
              ]}
              className="text-left"
            />
          </div>
        </StoryOverlay>
      </section>

      {/* Bannière talents défilant */}
      <section className="w-full bg-yellow-400 text-black py-4 relative overflow-hidden">
        <div className={`flex flex-col items-center justify-center h-full gap-12 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Texte défilant */}
          <div className="flex items-center gap-8 whitespace-nowrap animate-scroll-text w-full">
            {allTalents.map((talent, i) => (
              <span key={i} className="font-title uppercase text-4xl sm:text-5xl md:text-6xl text-black">{talent}</span>
            ))}
            {allTalents.map((talent, i) => (
              <span key={`repeat-${i}`} className="font-title uppercase text-4xl sm:text-5xl md:text-6xl text-black">{talent}</span>
            ))}
            {allTalents.map((talent, i) => (
              <span key={`repeat2-${i}`} className="font-title uppercase text-4xl sm:text-5xl md:text-6xl text-black">{talent}</span>
            ))}
          </div>
        </div>
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
            <TextBlock 
              title="L'équipe"
              description={[
                "Notre équipe est composée de Vins Crespo, créateur de la Savage et danseur professionnel, Niel DJ, Philipinne, Bilal, HAX, Saki, Rita amoureux, Le sympathique, Queen2 et SUNGOMA DJ.",
                "Chacun apporte sa créativité et son expertise pour créer des moments uniques où la musique et la danse se rencontrent dans une explosion d'énergie pure."
              ]}
              className="text-left"
            />
          </div>
        </StoryOverlay>
      </section>
    </main>
  );
}


