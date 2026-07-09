"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  glow?: boolean;
  lively?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Prestige Garage glowing brand crown logo.
 * Uses the uploaded crown PNG (33562fbd...png) with a radiant red glow animation
 * and an optional lively float + subtle rotation.
 */
export function BrandCrown({ size = 96, glow = true, lively = false, className, priority }: LogoProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        lively && "logo-lively",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* radial glow backdrop */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(227,6,19,0.55) 0%, rgba(227,6,19,0.15) 50%, transparent 75%)",
        }}
        aria-hidden
      />
      <Image
        src="/images/33562fbd-0491-47ac-9773-54319394fa7f.png"
        alt="Prestige Garage"
        width={size}
        height={size}
        priority={priority}
        className={cn("relative z-10 object-contain", glow && "logo-glow")}
      />
    </div>
  );
}

/** SONAX authorized dealer badge — small circular emblem */
export function SonaxBadge({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      style={{ width: size }}
    >
      <div
        className="relative rounded-full overflow-hidden bg-black ring-1 ring-white/15"
        style={{ width: size, height: size }}
      >
        <Image
          src="/images/Logo_Authorized_Detailer-1.png"
          alt="Authorized SONAX Dealer"
          fill
          className="object-contain p-1"
          sizes={`${size}px`}
        />
      </div>
    </div>
  );
}

/** Full Prestige Garage lockup: crown + wordmark */
export function BrandLockup({
  crownSize = 88,
  showTagline = true,
  className,
}: {
  crownSize?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <BrandCrown size={crownSize} priority />
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        <span className="crown-shine">PRESTIGE</span>{" "}
        <span className="text-white">GARAGE</span>
      </h1>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55 sm:text-xs">
        Premium Car Care
      </p>
      {showTagline && (
        <p className="mt-2 text-xs italic text-white/45">
          Born in Germany. Mastered in Egypt.
        </p>
      )}
    </div>
  );
}
