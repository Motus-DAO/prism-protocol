import React from "react";
import clsx from "clsx";

interface HoloPanelProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "floating";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const HoloPanel: React.FC<HoloPanelProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
  onClick,
  interactive = false,
}) => {
  const baseClasses = "relative overflow-hidden rounded-2xl crystal-glass crystal-glass-hover transition-all duration-300";

  const variantClasses = {
    default: "border-cyan-400/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]",
    elevated: "border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:shadow-[0_0_40px_rgba(0,255,255,0.3)]",
    floating: "border-fuchsia-400/20 shadow-[0_0_20px_rgba(255,0,255,0.1)] hover:border-fuchsia-400/30"
  };

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8"
  };

  const interactiveClasses = interactive
    ? "cursor-pointer hover:scale-[1.02] hover:bg-black/40"
    : "";

  return (
    <div
      onClick={onClick}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        interactiveClasses,
        "crystal-panel",
        className
      )}
    >
      {/* Geometric overlay */}
      <div className="geometric-overlay" />

      {/* Crystal corner accents */}
      <div className="crystal-corner-tl" />
      <div className="crystal-corner-tr" />
      <div className="crystal-corner-bl" />
      <div className="crystal-corner-br" />

      {/* Sharp geometric lines */}
      <div className="absolute top-0 left-1/4 right-1/4 h-0.5 crystal-line" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 crystal-line-magenta" />
      <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 crystal-line-purple" />
      <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 crystal-line" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
