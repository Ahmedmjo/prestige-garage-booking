"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollScrubSceneProps {
  src: string;
  poster: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  /** how many viewport-heights of scroll this scene "owns" before handing off */
  scrubLengthVh?: number;
  /** CSS background value for the gradient overlay; defaults to a left-to-right fade */
  overlay?: string;
  /** extra classes for the outer section, e.g. to center content instead of left-align */
  contentClassName?: string;
  children?: React.ReactNode;
}

/**
 * A pinned, scroll-scrubbed cinematic scene: the video is fully paused and
 * its currentTime is driven directly by scroll position. Scroll down ->
 * plays forward. Scroll up -> plays backward. Stop scrolling -> frame
 * freezes exactly where it is. Once the scene's scroll range is used up,
 * the pin releases and the page hands off to the next section naturally.
 *
 * Falls back to a static poster (no pin, no scrub) on prefers-reduced-motion
 * or a detected slow/data-saver connection.
 */
export default function ScrollScrubScene({
  src,
  poster,
  eyebrow,
  title,
  text,
  scrubLengthVh = 250,
  overlay,
  contentClassName,
  children,
}: ScrollScrubSceneProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [allowScrub, setAllowScrub] = useState(true);

  // Decide up front: reduced-motion / slow connection -> no scrubbing
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const conn = nav.connection;
    const slowConnection =
      conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
    if (reducedMotion || slowConnection) setAllowScrub(false);
  }, []);

  // Lazy-load: only fetch the video once the section is getting close
  useEffect(() => {
    if (!allowScrub) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "75% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [allowScrub]);

  // Wire up the actual scroll-scrub once the video can report its duration
  useEffect(() => {
    if (!allowScrub || !shouldLoad) return;
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    let trigger: ScrollTrigger | undefined;

    const setup = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      video.pause();

      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${scrubLengthVh}%`,
        pin: true,
        scrub: 0.5, // slight smoothing so fast scroll flicks don't feel jittery
        onUpdate: (self) => {
          const t = self.progress * video.duration;
          if (Number.isFinite(t)) video.currentTime = t;
        },
      });
    };

    if (video.readyState >= 1) {
      setup();
    } else {
      video.addEventListener("loadedmetadata", setup, { once: true });
    }

    return () => {
      trigger?.kill();
      video.removeEventListener("loadedmetadata", setup);
    };
  }, [allowScrub, shouldLoad, scrubLengthVh]);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[100vh] items-center overflow-hidden"
    >
      {allowScrub ? (
        shouldLoad && (
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster={poster}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={src} type="video/mp4" />
          </video>
        )
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            overlay ??
            "linear-gradient(90deg, var(--cinema-bg) 25%, rgba(5,5,5,0.75) 60%, rgba(5,5,5,0.25) 90%)",
        }}
      />

      <div
        className={
          contentClassName ?? "relative z-10 mx-auto w-full max-w-6xl px-6"
        }
      >
        {children ?? (
          <div className="max-w-md rounded-2xl bg-black/35 p-6 backdrop-blur-sm">
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--cinema-crimson)]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h3 className="mt-3 text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-3xl">
                {title}
              </h3>
            )}
            {text && (
              <p className="mt-4 text-sm leading-relaxed text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:text-base">
                {text}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
