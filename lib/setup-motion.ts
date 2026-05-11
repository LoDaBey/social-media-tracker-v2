import type { Transition, Variants } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const setupTransition: Transition = {
  duration: 0.35,
  ease,
};

export const setupSectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: setupTransition,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.25, ease },
  },
};

export const setupCardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    transition: { duration: 0.3, ease },
  },
};

export const setupRowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -6,
    transition: { duration: 0.22, ease },
  },
};

export const setupFooterVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease },
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: { duration: 0.25, ease },
  },
};

export const setupPillVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2, ease },
  },
};

export const setupIconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
};

export const setupHeroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.04 },
  },
};

export const setupFadeUpChild: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease },
  },
};

export const setupStaggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

export const setupPillList: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};

export const setupButtonSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 28,
};

export function setupButtonMotion(disabled: boolean) {
  return {
    whileHover: disabled ? undefined : { scale: 1.05 },
    whileTap: disabled ? undefined : { scale: 0.95 },
    transition: setupButtonSpring,
  };
}

/** Backdrop fade for submission / overlay drawers */
export const drawerBackdropTransition: Transition = {
  duration: 0.45,
  ease,
};

/**
 * Panel slide: desktop from the right (x 100% → 0); mobile bottom sheet (y 100% → 0).
 * Tween (not spring) so enter/exit duration is predictable and clearly visible.
 */
export const drawerPanelTransition: Transition = {
  type: "tween",
  duration: 0.55,
  ease,
};

/** Orchestrates backdrop + panel so enter/exit run in sequence */
export const drawerRootVariants: Variants = {
  open: {
    transition: { staggerChildren: 0.1, delayChildren: 0.04 },
  },
  closed: {
    transition: { staggerChildren: 0.09, staggerDirection: -1 },
  },
};

export const drawerBackdropVariants: Variants = {
  open: {
    opacity: 1,
    transition: drawerBackdropTransition,
  },
  closed: {
    opacity: 0,
    transition: { duration: 0.38, ease },
  },
};

export const drawerPanelVariants: Variants = {
  open: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: drawerPanelTransition,
  },
  closed: (isDesktop: boolean) => ({
    x: isDesktop ? "100%" : 0,
    y: isDesktop ? 0 : "100%",
    opacity: 0,
    transition: { type: "tween", duration: 0.5, ease },
  }),
};
