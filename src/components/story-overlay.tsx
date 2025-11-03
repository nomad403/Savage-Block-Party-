"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMenu } from "../hooks/useMenu";

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
  description?: string | string[];
  className?: string;
}

function LineByLineText({ text, className }: { text: string; className: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [rects, setRects] = useState<Array<{ left: number; top: number; width: number; height: number }>>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current || !textRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      const clientRects = Array.from(range.getClientRects());
      const mapped = clientRects.map((r) => ({
        left: r.left - containerRect.left,
        top: r.top - containerRect.top,
        width: r.width,
        height: r.height,
      }));
      // Ajustement sans interlignes: alignement aux pixels + pont entre lignes
      const adjusted = mapped.map((r) => ({
        left: Math.floor(r.left),
        top: Math.floor(r.top),
        width: Math.ceil(r.width),
        height: Math.ceil(r.height)
      }));
      for (let i = 0; i < adjusted.length; i++) {
        const prev = adjusted[i - 1];
        const curr = adjusted[i];
        const next = adjusted[i + 1];
        let topExp = curr.top;
        let bottomExp = curr.top + curr.height;
        if (prev) {
          const prevBottom = prev.top + prev.height;
          if (topExp > prevBottom) topExp = prevBottom; // combler l'espace
        }
        if (next) {
          const nextTop = next.top;
          if (bottomExp < nextTop) bottomExp = nextTop; // étendre jusqu'à la ligne suivante
        }
        curr.top = topExp;
        curr.height = Math.max(1, bottomExp - topExp);
      }
      setRects(adjusted);
      requestAnimationFrame(() => setActive(true));
    };

    measure();
    window.addEventListener('resize', measure);
    // Observer les changements de taille dus à la typo responsive/chargement de police
    let roContainer: ResizeObserver | null = null;
    let roText: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      if (containerRef.current) {
        roContainer = new ResizeObserver(() => measure());
        roContainer.observe(containerRef.current);
      }
      if (textRef.current) {
        roText = new ResizeObserver(() => measure());
        roText.observe(textRef.current);
      }
    }
    // Re-mesurer après chargement des polices
    // @ts-ignore
    if ((document as any).fonts && (document as any).fonts.ready) {
      // @ts-ignore
      (document as any).fonts.ready.then(() => measure()).catch(() => {});
    }
    return () => {
      window.removeEventListener('resize', measure);
      if (roContainer) roContainer.disconnect();
      if (roText) roText.disconnect();
    };
  }, [text]);

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Texte au-dessus */}
      <span ref={textRef} className={className} style={{ position: 'relative', zIndex: 1 }}>{text}</span>
      {/* Overlays cyan par ligne (révélation gauche→droite) */}
      {rects.map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
            background: '#22D3EE', // cyan
            transformOrigin: 'left center',
            transform: active ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 700ms ease-out',
            transitionDelay: `${i * 0.12}s`,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

export function TextBlock({ title, description, className = "" }: TextBlockProps) {
  const descriptions = Array.isArray(description) ? description : (description ? [description] : []);
  const { isMenuOpen } = useMenu();
  
  return (
    <div className={`max-w-2xl transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${className}`}>
      {title && (
        <LineByLineText 
          text={title} 
          className="font-title text-5xl md:text-6xl text-black mb-6 leading-tight text-justify break-words"
        />
      )}
      {descriptions.length > 0 && (
        <div className="space-y-4">
          {descriptions.map((desc, idx) => (
            <LineByLineText 
              key={idx}
              text={desc} 
              className="font-text text-lg md:text-xl text-black leading-[1.12] tracking-tight text-justify"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AccrocheText({ text }: { text: string }) {
  const { isMenuOpen } = useMenu();
  
  return (
    <div className={`text-center transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <LineByLineText 
        text={text}
        className="font-title text-4xl md:text-6xl text-black leading-tight"
      />
    </div>
  );
}
