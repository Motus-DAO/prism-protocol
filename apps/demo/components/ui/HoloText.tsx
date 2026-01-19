import React from "react";
import clsx from "clsx";

interface HoloTextProps {
  children: React.ReactNode;
  variant?: "display" | "heading" | "body" | "mono" | "gradient";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: "cyan" | "magenta" | "purple" | "white" | "muted";
  glow?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const HoloText: React.FC<HoloTextProps> = ({
  children,
  variant = "body",
  size = "base",
  weight = "normal",
  color = "white",
  glow = false,
  className,
  as: Component = "span",
}) => {
  const variantClasses = {
    display: "font-orbitron tracking-wide",
    heading: "font-mono",
    body: "font-body",
    mono: "font-mono",
    gradient: "font-orbitron bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent"
  };

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl"
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
  };

  const colorClasses = {
    cyan: "text-cyan-400",
    magenta: "text-fuchsia-400",
    purple: "text-purple-400",
    white: "text-white",
    muted: "text-white/60"
  };

  const glowClasses = glow ? {
    cyan: "neon-solid-cyan",
    magenta: "neon-solid-magenta",
    purple: "text-purple-400 [text-shadow:0_0_10px_#9D68FF]",
    white: "text-white",
    muted: "text-white/60"
  }[color] : "";

  return (
    <Component
      className={clsx(
        variantClasses[variant],
        sizeClasses[size],
        weightClasses[weight],
        variant !== "gradient" && colorClasses[color],
        glowClasses,
        className
      )}
    >
      {children}
    </Component>
  );
};
