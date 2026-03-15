import { describe, it, expect } from "vitest";
import {
  springs,
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInScale,
  slideInRight,
  slideInLeft,
  scaleIn,
  staggerContainer,
  staggerItem,
  staggerItemScale,
  panelSlideRight,
  collapseVertical,
  tabContent,
  dropdownVariants,
  tooltipVariants,
  pulseVariants,
  shimmer,
  layoutTransition,
} from "@/lib/animations";

describe("Animation utilities", () => {
  describe("springs", () => {
    it("exports four spring configs", () => {
      expect(springs.snappy).toBeDefined();
      expect(springs.smooth).toBeDefined();
      expect(springs.gentle).toBeDefined();
      expect(springs.bouncy).toBeDefined();
    });

    it("all springs use spring type", () => {
      for (const key of ["snappy", "smooth", "gentle", "bouncy"] as const) {
        expect(springs[key]).toHaveProperty("type", "spring");
        expect(springs[key]).toHaveProperty("stiffness");
        expect(springs[key]).toHaveProperty("damping");
      }
    });

    it("snappy has higher stiffness than gentle", () => {
      expect((springs.snappy as { stiffness: number }).stiffness).toBeGreaterThan(
        (springs.gentle as { stiffness: number }).stiffness
      );
    });
  });

  describe("inline animation props", () => {
    it("fadeIn has initial, animate, exit, transition", () => {
      expect(fadeIn.initial).toEqual({ opacity: 0 });
      expect(fadeIn.animate).toEqual({ opacity: 1 });
      expect(fadeIn.exit).toEqual({ opacity: 0 });
      expect(fadeIn.transition).toBeDefined();
    });

    it("fadeInUp translates from y=8", () => {
      expect(fadeInUp.initial).toEqual({ opacity: 0, y: 8 });
      expect(fadeInUp.animate).toEqual({ opacity: 1, y: 0 });
    });

    it("fadeInDown translates from y=-8", () => {
      expect(fadeInDown.initial).toEqual({ opacity: 0, y: -8 });
      expect(fadeInDown.animate).toEqual({ opacity: 1, y: 0 });
    });

    it("fadeInScale starts at 0.95 scale", () => {
      expect(fadeInScale.initial).toEqual({ opacity: 0, scale: 0.95 });
      expect(fadeInScale.animate).toEqual({ opacity: 1, scale: 1 });
    });

    it("slideInRight translates from x=20", () => {
      expect(slideInRight.initial).toEqual({ opacity: 0, x: 20 });
      expect(slideInRight.animate).toEqual({ opacity: 1, x: 0 });
    });

    it("slideInLeft translates from x=-20", () => {
      expect(slideInLeft.initial).toEqual({ opacity: 0, x: -20 });
      expect(slideInLeft.animate).toEqual({ opacity: 1, x: 0 });
    });

    it("scaleIn starts at 0.8 scale", () => {
      expect(scaleIn.initial).toEqual({ scale: 0.8, opacity: 0 });
      expect(scaleIn.animate).toEqual({ scale: 1, opacity: 1 });
    });
  });

  describe("stagger variants", () => {
    it("staggerContainer has staggerChildren", () => {
      expect(staggerContainer.visible).toBeDefined();
      const visible = staggerContainer.visible as Record<string, unknown>;
      expect(visible.transition).toBeDefined();
      const transition = visible.transition as Record<string, unknown>;
      expect(transition.staggerChildren).toBeGreaterThan(0);
    });

    it("staggerItem has hidden and visible states", () => {
      expect(staggerItem.hidden).toBeDefined();
      expect(staggerItem.visible).toBeDefined();
    });

    it("staggerItemScale uses scale transforms", () => {
      const hidden = staggerItemScale.hidden as Record<string, unknown>;
      expect(hidden.scale).toBeLessThan(1);
    });
  });

  describe("panel variants", () => {
    it("panelSlideRight starts with width 0", () => {
      const hidden = panelSlideRight.hidden as Record<string, unknown>;
      expect(hidden.width).toBe(0);
      expect(hidden.opacity).toBe(0);
    });

    it("collapseVertical starts with height 0", () => {
      const hidden = collapseVertical.hidden as Record<string, unknown>;
      expect(hidden.height).toBe(0);
      expect(hidden.overflow).toBe("hidden");
    });
  });

  describe("tab content variants", () => {
    it("has hidden, visible, exit states", () => {
      expect(tabContent.hidden).toBeDefined();
      expect(tabContent.visible).toBeDefined();
      expect(tabContent.exit).toBeDefined();
    });
  });

  describe("dropdown variants", () => {
    it("starts scaled down and offset", () => {
      const hidden = dropdownVariants.hidden as Record<string, unknown>;
      expect(hidden.scale).toBeLessThan(1);
      expect(hidden.opacity).toBe(0);
    });
  });

  describe("tooltip variants", () => {
    it("starts hidden with offset", () => {
      const hidden = tooltipVariants.hidden as Record<string, unknown>;
      expect(hidden.opacity).toBe(0);
      expect(hidden.x).toBeDefined();
    });
  });

  describe("pulse variants", () => {
    it("has idle and pulse states", () => {
      expect(pulseVariants.idle).toBeDefined();
      expect(pulseVariants.pulse).toBeDefined();
    });

    it("pulse state uses infinite repeat", () => {
      const pulse = pulseVariants.pulse as Record<string, unknown>;
      const transition = pulse.transition as Record<string, unknown>;
      expect(transition.repeat).toBe(Infinity);
    });
  });

  describe("shimmer", () => {
    it("has animate and transition props", () => {
      expect(shimmer.animate).toBeDefined();
      expect(shimmer.transition).toBeDefined();
    });
  });

  describe("layoutTransition", () => {
    it("has layout true and transition", () => {
      expect(layoutTransition.layout).toBe(true);
      expect(layoutTransition.transition).toBeDefined();
    });
  });
});
