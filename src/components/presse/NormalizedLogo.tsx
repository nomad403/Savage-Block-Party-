"use client";

import React from "react";

interface NormalizedLogoProps {
  LogoComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  ariaLabel: string;
  /** Largeur cible du logo en pixels (dimension principale) */
  size?: number;
  /** Compatibilité avec l'ancienne API (alias de `size`) */
  targetSize?: number;
  /** Facteur d'échelle optique pour ajuster visuellement un logo (ex: 0.9, 1.1, etc.) */
  opticalScale?: number;
  className?: string;
}

/**
 * Composant simple pour normaliser la taille des logos de manière **optique**
 * en se basant sur une largeur fixe.
 *
 * - On fixe une largeur cible (`size` / `targetSize`)
 * - Le SVG garde son ratio avec `width: auto`
 * - On peut ajuster au cas par cas avec `opticalScale`
 *
 * Pas de getBBox, pas de ResizeObserver → comportement stable et prévisible.
 */
export function NormalizedLogo({
  LogoComponent,
  ariaLabel,
  size,
  targetSize,
  opticalScale = 1,
  className = "",
}: NormalizedLogoProps) {
  // `size` prioritaire, puis `targetSize`, puis 120px par défaut
  const finalSize = size ?? targetSize ?? 120;
  const hasOpticalScale = opticalScale !== 1;

  return (
    <div
      className={`presse-logo-item ${className}`}
      style={{
        width: finalSize,
        height: finalSize * 0.6, // hauteur proportionnelle
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    >
    <div
      className="presse-logo-svg"
      style={{
        width: "100%",
        height: "100%",
        transform: hasOpticalScale ? `scale(${opticalScale})` : undefined,
        transformOrigin: "center",
      }}
    >
        <LogoComponent
          aria-label={ariaLabel}
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  );
}

