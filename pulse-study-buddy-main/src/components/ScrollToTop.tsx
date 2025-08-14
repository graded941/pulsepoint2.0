import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion) {
      // Instant scroll for users who prefer reduced motion
      window.scrollTo(0, 0);
    } else {
      // Smooth scroll for others
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;

