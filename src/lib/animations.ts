/**
 * Framer Motion animation presets for Operator UI
 *
 * Usage:
 *   <motion.div {...fadeIn}>content</motion.div>
 *   <motion.div variants={staggerContainer} initial="hidden" animate="visible">
 *     <motion.div variants={staggerItem}>child</motion.div>
 *   </motion.div>
 */
import type { Variants, Transition, MotionProps } from "framer-motion";

// ── Spring configs ───────────────────────────────────────────────────────────

export const springs = {
  /** Snappy, responsive — buttons, toggles */
  snappy: { type: "spring", stiffness: 500, damping: 30 } as Transition,
  /** Smooth, natural — panels, overlays */
  smooth: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  /** Gentle, slow settle — page transitions */
  gentle: { type: "spring", stiffness: 200, damping: 24 } as Transition,
  /** Bouncy — notifications, badges */
  bouncy: { type: "spring", stiffness: 400, damping: 15 } as Transition,
} as const;

// ── Inline animation props (spread directly) ────────────────────────────────

export const fadeIn: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

export const fadeInUp: MotionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: springs.smooth,
};

export const fadeInDown: MotionProps = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: springs.smooth,
};

export const fadeInScale: MotionProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: springs.snappy,
};

export const slideInRight: MotionProps = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: springs.smooth,
};

export const slideInLeft: MotionProps = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: springs.smooth,
};

export const scaleIn: MotionProps = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: springs.bouncy,
};

// ── Stagger containers and children ──────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.1 },
  },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
  exit: { opacity: 0, scale: 0.92 },
};

// ── Panel / sidebar animations ───────────────────────────────────────────────

export const panelSlideRight: Variants = {
  hidden: { width: 0, opacity: 0 },
  visible: {
    width: "auto",
    opacity: 1,
    transition: { ...springs.smooth, opacity: { delay: 0.05, duration: 0.15 } },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
};

export const collapseVertical: Variants = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    overflow: "hidden",
    transition: { ...springs.smooth, opacity: { duration: 0.15 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    transition: { duration: 0.15, ease: "easeInOut" },
  },
};

// ── Tab content transition ───────────────────────────────────────────────────

export const tabContent: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.1 },
  },
};

// ── Dropdown / popover ───────────────────────────────────────────────────────

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: { duration: 0.1 },
  },
};

// ── Tooltip ──────────────────────────────────────────────────────────────────

export const tooltipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, x: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.12, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.08 },
  },
};

// ── Status pulse ─────────────────────────────────────────────────────────────

export const pulseVariants: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.4, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ── Loading shimmer ──────────────────────────────────────────────────────────

export const shimmer: MotionProps = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear",
  },
};

// ── Layout transition helper ─────────────────────────────────────────────────

export const layoutTransition = {
  layout: true,
  transition: springs.smooth,
} as const;
