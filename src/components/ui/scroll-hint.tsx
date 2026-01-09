"use client";

import { useState, useEffect } from "react";
import { useMenu } from "@/hooks/useMenu";

interface ScrollHintProps {
  text?: string;
  color?: string;
  className?: string;
  hideWhenDropdownsVisible?: boolean; // Si true, masque quand les dropdowns sont visibles
  dropdownsVisible?: boolean; // État de visibilité des dropdowns (pour la page family)
}

export default function ScrollHint({ 
  text = "scroll to see our family", 
  color = "#22C55E",
  className = "",
  hideWhenDropdownsVisible = false,
  dropdownsVisible = false
}: ScrollHintProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { isMenuOpen } = useMenu();

  useEffect(() => {
    // Si hideWhenDropdownsVisible est activé, la visibilité dépend de dropdownsVisible
    if (hideWhenDropdownsVisible) {
      setIsVisible(!dropdownsVisible);
      return;
    }

    // Sinon, logique de scroll normale
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Masquer si l'utilisateur a scrollé ou s'il est proche du bas
      if (scrollY > 50) {
        setHasScrolled(true);
        setIsVisible(false);
      } else if (scrollY === 0 && hasScrolled) {
        // Réafficher si on revient tout en haut
        setIsVisible(true);
      }
      
      // Masquer si on est proche du bas (90% de la page)
      const scrollProgress = scrollY / (documentHeight - windowHeight);
      if (scrollProgress > 0.9) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled, hideWhenDropdownsVisible, dropdownsVisible]);

  if (isMenuOpen || !isVisible) return null;

  return (
    <div 
      className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none transition-opacity duration-500 ${className}`}
      style={{ 
        opacity: isVisible ? 1 : 0
      } as React.CSSProperties}
    >
      <span 
        className="font-text text-sm uppercase tracking-wider"
        style={{ color }}
      >
        {text}
      </span>
      <div className="flex flex-col items-center gap-1">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ color }}
          className="animate-bounce"
        >
          <path 
            d="M7 10L12 15L17 10" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ color, animationDelay: '0.15s' }}
          className="opacity-60 animate-bounce"
        >
          <path 
            d="M7 10L12 15L17 10" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

