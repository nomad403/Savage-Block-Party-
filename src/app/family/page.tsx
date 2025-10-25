import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family — Savage Block Party",
};

export default function FamilyPage() {
  return (
    <main className="relative">
      {/* Section hero avec image de fond fullscreen */}
      <section className="fixed inset-0 w-full h-full overflow-hidden">
        {/* Image de fond fullscreen qui passe derrière le header */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/family/images/SAVAGE-74.jpg')",
            backgroundAttachment: "fixed"
          }}
        />
        
        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Contenu centré */}
        <div className="relative z-10 h-full flex items-center justify-center pt-20">
          <div className="text-center px-4">
            <h1 className="font-title uppercase text-6xl sm:text-7xl md:text-8xl text-yellow-400 mb-6 leading-tight">
              Une famille
            </h1>
            <p className="font-text text-xl sm:text-2xl text-yellow-400/90 max-w-2xl mx-auto leading-relaxed">
              qui vibre au rythme de la musique urbaine
            </p>
          </div>
        </div>
      </section>
      
      {/* Spacer pour le contenu scrollable */}
      <div className="h-screen" />
    </main>
  );
}


