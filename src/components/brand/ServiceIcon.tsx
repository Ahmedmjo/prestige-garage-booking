"use client";

import {
  Sofa,
  Triangle,
  CircleDot,
  Cog,
  Crown,
  Droplets,
  Car,
  Shield,
  ShieldCheck,
  Sparkles,
  Lightbulb,
  Armchair,
  Wind,
  Brush,
  Gem,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Sofa,
  Triangle,
  CircleDot,
  Cog,
  Crown,
  Droplets,
  Car,
  Shield,
  ShieldCheck,
  Sparkles,
  Lightbulb,
  Armchair,
  Wind,
  Brush,
  Gem,
};

export function ServiceIcon({
  name,
  className,
  size = 22,
  color,
}: {
  name: string | null;
  className?: string;
  size?: number;
  color?: string;
}) {
  const Icon = (name && MAP[name]) || Sparkles;
  return (
    <Icon
      className={className}
      size={size}
      strokeWidth={2}
      style={color ? { color } : undefined}
    />
  );
}
