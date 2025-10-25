"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface StoryOverlayProps {
  children: React.ReactNode;
  className?: string;
}

export default function StoryOverlay({ children, className = "" }: StoryOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className={`absolute inset-0 flex items-center justify-center z-10 ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface TextBlockProps {
  title: string;
  description?: string;
  className?: string;
}

function LineByLineText({ text, className }: { text: string; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineData, setLineData] = useState<Array<{width: number, top: number, height: number}>>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    // Créer un élément temporaire pour mesurer
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.className = className;
    document.body.appendChild(tempDiv);

    words.forEach((word, index) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      tempDiv.textContent = testLine;
      
      if (tempDiv.scrollWidth > container.offsetWidth && currentLine) {
        // La ligne précédente était complète
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
      
      if (index === words.length - 1) {
        // Dernière ligne
        lines.push(currentLine);
      }
    });

    // Calculer les dimensions de chaque ligne
    const lineHeight = parseFloat(getComputedStyle(tempDiv).lineHeight) || 28;
    const lineDimensions = lines.map((line, index) => {
      tempDiv.textContent = line;
      return {
        width: tempDiv.scrollWidth,
        top: index * lineHeight,
        height: lineHeight
      };
    });

    document.body.removeChild(tempDiv);
    setLineData(lineDimensions);
    
    // Initialiser les refs
    lineRefs.current = new Array(lineDimensions.length).fill(null);
  }, [text, className]);

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Texte normal pour la disposition */}
      <div className={className}>
        {text}
      </div>
      
      {/* Overlays d'animation pour chaque ligne */}
      {lineData.map((line, index) => (
        <motion.div
          key={index}
          ref={(el) => lineRefs.current[index] = el}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 + (index * 0.2) }}
          className="text-reveal-line"
          style={{
            top: `${line.top}px`,
            left: '-12px', // Décalage pour compenser le padding gauche (8px) et créer l'espacement
            width: `${line.width + 20}px`, // Largeur de la ligne + padding total (8px gauche + 12px droite)
            height: `${line.height}px`, // Hauteur exacte de la ligne
          }}
          onAnimationComplete={() => {
            setTimeout(() => {
              if (lineRefs.current[index]) {
                lineRefs.current[index]!.classList.add('animate-in');
              }
            }, 100);
          }}
        />
      ))}
    </div>
  );
}

export function TextBlock({ title, description, className = "" }: TextBlockProps) {
  return (
    <div className={`max-w-md ${className}`}>
      {title && (
        <LineByLineText 
          text={title} 
          className="font-title text-4xl md:text-5xl lg:text-6xl text-black mb-6 leading-tight"
        />
      )}
      {description && (
        <LineByLineText 
          text={description} 
          className="font-text text-lg md:text-xl text-black leading-relaxed"
        />
      )}
    </div>
  );
}

export function AccrocheText({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="text-center"
    >
      <h1 className="font-title text-5xl md:text-6xl lg:text-7xl text-cyan-400 leading-tight">
        {text}
      </h1>
    </motion.div>
  );
}
