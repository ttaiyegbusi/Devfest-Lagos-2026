"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { AskPanel } from "./AskPanel";
import "./FloatingAskButton.css";

const buttonStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "32px",
  right: "32px",
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "56px",
  height: "56px",
  minWidth: "56px",
  minHeight: "56px",
  padding: 0,
  border: "none",
  borderRadius: "50%",
  background: "#f9ab00",
  color: "#fff",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(23, 23, 23, 0.2)",
  transition: "transform 200ms ease, box-shadow 200ms ease",
};

export function FloatingAskButton() {
  const pathname = usePathname();
  const [asking, setAsking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // On landing page, observe when hero scrolls out of view
  useEffect(() => {
    if (pathname !== "/") return;

    const heroElement = document.querySelector("[data-sentinel='hero']");
    if (!heroElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(heroElement);
    return () => observer.disconnect();
  }, [pathname]);

  if (!isMounted) {
    return null;
  }

  // Hide on landing page while hero is visible, show everywhere else
  if (pathname === "/" && heroVisible) {
    return null;
  }

  const hoverStyle = isHovered
    ? {
        transform: "scale(1.08)",
        boxShadow: "0 6px 16px rgba(23, 23, 23, 0.3)",
      }
    : {};

  return (
    <>
      <button
        type="button"
        className="floating-ask"
        ref={trigger}
        aria-expanded={asking}
        onClick={() => setAsking((v) => !v)}
        aria-label={asking ? "Close the question panel" : "Ask a question about DevFest"}
        style={{ ...buttonStyle, ...hoverStyle }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 1.6l1.9 4.9 4.9 1.9-4.9 1.9L10 15.2 8.1 10.3 3.2 8.4l4.9-1.9L10 1.6Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <AskPanel open={asking} onClose={() => setAsking(false)} returnTo={trigger} />
    </>
  );
}
