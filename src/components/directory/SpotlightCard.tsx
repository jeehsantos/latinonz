import { forwardRef, type MouseEvent, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = {
  as?: "div" | "button";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

function handleMouseMove(e: MouseEvent<HTMLElement>) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
  target.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}

export const SpotlightCard = forwardRef<HTMLDivElement, SpotlightCardProps>(
  ({ children, className, style, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onClick={onClick}
        className={cn("spotlight-card", className)}
        style={style}
      >
        {children}
      </div>
    );
  },
);
SpotlightCard.displayName = "SpotlightCard";
