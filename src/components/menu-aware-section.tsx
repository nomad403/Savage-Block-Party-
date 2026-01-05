"use client";

import { ReactNode } from "react";
import { useMenu } from "../hooks/useMenu";

interface MenuAwareSectionProps {
  children: ReactNode;
  className?: string;
}

export default function MenuAwareSection({ children, className = "" }: MenuAwareSectionProps) {
  const { isMenuOpen } = useMenu();
  
  return (
    <div className={`${className} transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {children}
    </div>
  );
}

