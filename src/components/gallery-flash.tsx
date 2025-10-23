"use client";

import { useEffect, useState } from "react";

// Liste des photos dans le dossier gallery_flash
const galleryImages = [
  "_DSC0965.jpg",
  "5R2A6292.jpg", 
  "IMG_8628.JPG",
  "IMG_8629.JPG",
  "IMG_8631.JPG",
  "IMG_8634.JPG",
  "IMG_8635.JPG",
  "IMG_8641.JPG",
  "IMG_8644.JPG",
  "IMG_8648.JPG",
  "IMG_8651.JPG",
  "IMG_8654.JPG",
  "IMG_8655.JPG"
];

export default function GalleryFlash() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instagramHandle, setInstagramHandle] = useState("");

  // Défilement automatique toutes les 2 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instagramHandle.trim()) {
      // Ici vous pouvez ajouter la logique pour envoyer la candidature
      console.log('Candidature Instagram:', instagramHandle);
      // Pour l'instant, on peut ouvrir un lien Instagram ou envoyer un email
      window.open(`https://instagram.com/${instagramHandle.replace('@', '')}`, '_blank');
    }
  };

  return (
    <div className="w-full">
      {/* Galerie photos avec défilement flash */}
      <div className="relative w-full aspect-video overflow-hidden">
        {/* Galerie photos avec défilement flash */}
        <div className="absolute inset-0">
          {galleryImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={`/agenda/photo/gallery_flash/${image}`}
                alt={`Gallery flash ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Vidéo dancer.webm centrée au-dessus */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <video
            src="/general/dancer.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full max-w-none max-h-none object-contain"
            style={{ minWidth: '600px', minHeight: '600px' }}
          />
          {/* Titre "join the family" avec flèche */}
          <div
            style={{
              position: 'absolute',
              left: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FACC15',
              fontSize: '64px',
              fontWeight: 'bold',
              fontFamily: 'Hanson, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '4px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '16px'
            }}
          >
            <span>join the</span>
            <span>family</span>
            <div
              style={{
                width: '0',
                height: '0',
                borderLeft: '24px solid transparent',
                borderRight: '24px solid transparent',
                borderTop: '32px solid #FACC15',
                marginTop: '16px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Section formulaire de candidature */}
      <div className="w-full bg-yellow-400 py-20 px-8 pb-68">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[400px]">
            {/* Formulaire à gauche */}
            <div className="flex flex-col justify-center">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="instagram" className="block text-black text-lg font-title mb-3">
                    Votre Instagram
                  </label>
                  <div className="flex w-full max-w-md">
                    <span className="bg-black text-yellow-400 px-4 py-3 text-lg font-title">@</span>
                    <input
                      type="text"
                      id="instagram"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="votre_pseudo"
                      className="flex-1 bg-transparent border-2 border-black text-black text-lg font-title px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full max-w-md bg-black text-yellow-400 py-3 px-8 text-lg font-title uppercase tracking-wider hover:bg-gray-800 transition-colors duration-200"
                >
                  Candidater
                </button>
              </form>
            </div>

            {/* Texte à droite */}
            <div className="text-black flex flex-col justify-center">
              <h2 className="text-5xl font-title uppercase mb-8 leading-tight">
                Rejoins le collectif
              </h2>
              <div className="space-y-6 text-xl font-text leading-relaxed">
                <p>
                  Tu es artiste, créateur, ou simplement passionné par la culture urbaine ? 
                  Savage Block Party cherche de nouveaux talents pour enrichir sa communauté.
                </p>
                <p>
                  Partage ton Instagram et montre-nous ton univers. Nous étudions chaque candidature 
                  avec attention pour découvrir les prochaines pépites du collectif.
                </p>
                <p className="font-title text-2xl">
                  Prêt à faire partie de l'aventure ?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
