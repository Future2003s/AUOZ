"use client";
import { ReactNode, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

interface ClientContentProps {
  children: ReactNode;
}

/**
 * Client-side wrapper to prevent full page reloads
 * Maintains component state during navigation
 */
export default function ClientContent({ children }: ClientContentProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only update content when pathname actually changes
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsTransitioning(true);
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 50);
      return () => clearTimeout(timer);
    } else if (displayChildren !== children) {
      // Update children if they changed but pathname didn't (same route, different props)
      setDisplayChildren(children);
    }
  }, [pathname, children, displayChildren]);

  return (
    <div className={isTransitioning ? "opacity-0" : "opacity-100 transition-opacity duration-150"}>
      {displayChildren}
    </div>
  );
}

