"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

interface DrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  side?: "right" | "left";
}

/**
 * Smooth custom drawer with spring physics — replaces the default Sheet
 * for a more fluid, premium feel.
 */
export function Drawer({ open, onOpenChange, children, side = "right" }: DrawerProps) {
  // lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  // In RTL, "right" side visually means the drawer slides from the right edge.
  // framer-motion x uses the visual direction.
  const initialX = side === "right" ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          {/* panel */}
          <motion.div
            initial={{ x: initialX }}
            animate={{ x: 0 }}
            exit={{ x: initialX }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34,
              mass: 0.8,
            }}
            className={`fixed top-0 bottom-0 z-50 ${
              side === "right" ? "right-0" : "left-0"
            } w-[82%] max-w-[300px] bg-background border-${
              side === "right" ? "l" : "r"
            } border-white/8 shadow-2xl overflow-hidden flex flex-col`}
          >
            {/* close handle */}
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="absolute top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition"
              style={side === "right" ? { left: "8px" } : { right: "8px" }}
            >
              <X size={18} />
            </button>
            <div className="flex-1 overflow-hidden">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
