"use client";

import { type CSSProperties, useEffect, useState } from "react";

export function AnimatedWaves() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function updateProgress() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
        setScrollProgress(Math.min(1, Math.max(0, progress)));
      });
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const y = scrollProgress * 76;
  const sway = Math.sin(scrollProgress * Math.PI) * 42;
  const drawn = 0.2 + scrollProgress * 0.8;
  const pathStyle = (x: number, vertical: number): CSSProperties => ({
    "--wave-draw": 1 - drawn,
    transform: `translate3d(${x}px, ${vertical}px, 0)`,
  } as CSSProperties);

  return (
    <div className="wave-field" aria-hidden="true">
      <svg className="wave-svg" viewBox="0 0 1440 2400" preserveAspectRatio="none">
        <path
          className="wave-path wave-green"
          pathLength="1"
          style={pathStyle(sway, y)}
          d="M120 0 C 520 260, 920 180, 1260 460 S 760 900, 1030 1220 S 1360 1680, 760 1890 S 180 2160, 480 2400"
        />
        <path
          className="wave-path wave-rust"
          pathLength="1"
          style={pathStyle(-sway * 0.7, y * 0.72)}
          d="M-40 180 C 360 420, 820 360, 1120 650 S 560 1060, 820 1380 S 1180 1760, 560 1990 S 40 2230, 240 2400"
        />
        <path
          className="wave-path wave-gold"
          pathLength="1"
          style={pathStyle(sway * 0.45, y * 0.52)}
          d="M360 0 C 760 300, 1180 300, 1340 620 S 940 1060, 1170 1410 S 1380 1860, 900 2050 S 420 2240, 720 2400"
        />
      </svg>
    </div>
  );
}
