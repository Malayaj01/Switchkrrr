"use client";

import { useEffect, useRef, useState } from "react";

export function RevealSection({ children, className }: { children: React.ReactNode; className: string }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`${className} reveal-block${visible ? " is-visible" : ""}`}>
      {children}
    </section>
  );
}
