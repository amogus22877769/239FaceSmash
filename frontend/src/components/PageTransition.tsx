import { useEffect, useState, useLayoutEffect, type PropsWithChildren, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./PageTransition.css";

export function PageTransition({ children }: PropsWithChildren) {
  const location = useLocation();
  const [transitionStage, setTransitionStage] = useState("hidden");
  const prevPathnameRef = useRef<string | null>(null);
  const isFirstMount = useRef(true);

  // On first mount, start hidden then fade in
  useLayoutEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPathnameRef.current = location.pathname;
      // Trigger fadeIn after a microtask to ensure content is rendered but hidden
      Promise.resolve().then(() => {
        requestAnimationFrame(() => {
          setTransitionStage("fadeIn");
        });
      });
    }
  }, []);

  // Handle route changes
  useEffect(() => {
    if (prevPathnameRef.current === null) {
      return;
    }

    // On route change
    if (location.pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = location.pathname;
      
      // Start fade out
      setTransitionStage("fadeOut");
      
      // After fade out completes, switch to hidden then fade in
      const timer = setTimeout(() => {
        setTransitionStage("hidden");
        // Wait for next frame to ensure hidden state is applied
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionStage("fadeIn");
          });
        });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div className={`page-transition page-transition--${transitionStage}`}>
      {children}
    </div>
  );
}

