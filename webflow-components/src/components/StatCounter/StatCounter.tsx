import React, { useEffect, useRef, useState } from "react";
import styles from "./StatCounter.module.css";

export type StatCounterTone = "light" | "dark" | "accent";

export interface StatCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  duration?: number;
  tone?: StatCounterTone;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  prefix = "",
  suffix = "",
  label,
  duration = 1600,
  tone = "light",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // Seeded with the final value so server-rendered markup and the first client
  // render agree, and so the number is present for crawlers if JS never runs.
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion || duration <= 0) {
      setDisplayed(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayed(Math.round(easeOutCubic(progress) * value));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        setDisplayed(0);
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <div ref={ref} className={`${styles.stat} ${styles[tone]}`}>
      <div className={styles.value}>
        {prefix}
        <span aria-hidden="true">{displayed.toLocaleString()}</span>
        <span className={styles.srOnly}>{value.toLocaleString()}</span>
        {suffix}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
};
