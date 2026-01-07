"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMenuHover } from "../hooks/useMenuHover";

/**
 * Overlay global qui s'affiche au hover des boutons menu
 * Doit être rendu au plus haut niveau du DOM (dans layout.tsx)
 * pour être au-dessus de tous les stacking contexts
 */
export default function MenuOverlay() {
  const { hoveredMenuItem, overlayColor } = useMenuHover();

  return (
    <AnimatePresence>
      {hoveredMenuItem && overlayColor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{ backgroundColor: overlayColor }}
        />
      )}
    </AnimatePresence>
  );
}

