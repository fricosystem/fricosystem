import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  /** Direção da entrada quando o elemento surge no scroll */
  direction?: RevealDirection;
  /** Atraso em ms para compor efeitos em cascata */
  delay?: number;
  /** Duração da transição em ms */
  duration?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

const OFFSETS: Record<RevealDirection, { enter: string; exitAhead: string; exitBehind: string }> = {
  up: { enter: "translate-y-10", exitAhead: "translate-y-10", exitBehind: "-translate-y-10" },
  down: { enter: "-translate-y-10", exitAhead: "translate-y-10", exitBehind: "-translate-y-10" },
  left: { enter: "-translate-x-10", exitAhead: "-translate-x-10", exitBehind: "-translate-x-10" },
  right: { enter: "translate-x-10", exitAhead: "translate-x-10", exitBehind: "translate-x-10" },
  none: { enter: "", exitAhead: "", exitBehind: "" },
};

/**
 * Revela o conteúdo com fade-in ao entrar na viewport e fade-out reverso ao sair,
 * respeitando o sentido do scroll (descendo ou subindo).
 */
export const Reveal = ({
  children,
  direction = "up",
  delay = 0,
  duration = 700,
  className = "",
  as: Tag = "div",
}: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  // "ahead" = elemento está abaixo da viewport; "behind" = acima dela
  const [side, setSide] = useState<"ahead" | "behind">("ahead");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          setSide(entry.boundingClientRect.top > 0 ? "ahead" : "behind");
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "-6% 0px -6% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const offsets = OFFSETS[direction];
  const hiddenOffset = side === "ahead" ? offsets.exitAhead : offsets.exitBehind;

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
      className={`transition-all ease-out will-change-[opacity,transform] motion-reduce:transition-none ${
        visible ? "opacity-100 translate-x-0 translate-y-0 blur-0" : `opacity-0 ${hiddenOffset}`
      } ${className}`}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
