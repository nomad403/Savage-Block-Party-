"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function Header() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isAgenda = pathname?.startsWith("/agenda");
    const barColor = isHome ? "bg-yellow-400" : "bg-black"; // jaune sur home, noir ailleurs (agenda)
    const logoClass = isHome ? "logo-tint-yellow" : "logo-tint-black";
    const headerBg = isHome ? "bg-transparent" : (isAgenda ? "bg-yellow-400" : "bg-transparent");

    // Fermer le menu lors d'un changement de route
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // Nom de la page affiché à gauche (non-home)
    const pageLabel = (() => {
        if (isHome) return "";
        const first = (pathname || "/").split("/").filter(Boolean)[0] || "";
        if (!first) return "";
        const name = first.replace(/-/g, " ");
        return name.charAt(0).toUpperCase() + name.slice(1);
    })();

	return (
		<>
            <header className={`container-px h-20 flex items-center justify-between z-20 relative ${headerBg} pt-8`}>
                <div className="min-w-10">
                    {!isHome && (
                        <span className={`font-title uppercase tracking-wide text-sm ${isAgenda ? "text-black" : "text-black"}`}>
                            {pageLabel}
                        </span>
                    )}
                </div>
                <div className="flex-1 flex justify-center">
                    <Image className={logoClass} src="/home/images/logo_orange.png" alt="Savage Block Party" width={240} height={60} priority />
                </div>
                <button aria-label="Menu" className="flex items-center gap-2" onClick={() => setOpen(true)}>
					<span className="sr-only">Menu</span>
                    <div className="flex flex-col gap-1.5">
                        <span className={`block w-7 h-[2px] ${barColor}`} />
                        <span className={`block w-7 h-[2px] ${barColor}`} />
                        <span className={`block w-7 h-[2px] ${barColor}`} />
					</div>
				</button>
			</header>

			<AnimatePresence>
				{open && (
					<motion.div
						key="menu"
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
						className="fixed inset-0 z-50 bg-yellow-400 text-black"
					>
						<div className="h-full w-full flex">
							<button aria-label="Fermer" onClick={() => setOpen(false)} className="absolute left-4 top-6 p-3">
								<span className="sr-only">Fermer</span>
								<div className="relative w-6 h-6">
									<span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 block h-[2px] bg-black rotate-45" />
									<span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 block h-[2px] bg-black -rotate-45" />
								</div>
							</button>

                            <nav className="ml-auto h-full w-full flex flex-col justify-center items-end gap-0 pr-10 sm:pr-14">
								{[
									{ href: "/", label: "home" },
									{ href: "/agenda", label: "agenda" },
									{ href: "/story", label: "story" },
									{ href: "/family", label: "family" },
									{ href: "/shop", label: "shop" },
									{ href: "/presse", label: "presse" },
								].map((item) => (
                                    <Link
										key={item.href}
										href={item.href}
                                        className="menu-link w-full font-title uppercase text-4xl sm:text-5xl md:text-6xl leading-none"
										onClick={() => setOpen(false)}
									>
										<span>{item.label}</span>
									</Link>
								))}
							</nav>


						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}

