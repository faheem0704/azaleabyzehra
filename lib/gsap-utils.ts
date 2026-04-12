"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Register plugins (call this once in a client component)
export function registerGSAPPlugins() {
  if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, SplitText);
  }
}

// Animate text character by character
export function animateSplitText(
  element: Element,
  options?: gsap.TweenVars
): gsap.core.Timeline {
  const split = new SplitText(element, { type: "chars,words" });
  const tl = gsap.timeline();
  tl.from(split.chars, {
    opacity: 0,
    y: 40,
    rotateX: -90,
    stagger: 0.02,
    duration: 0.8,
    ease: "power3.out",
    ...options,
  });
  return tl;
}

// Fade-up stagger for grids
export function staggerFadeUp(
  elements: Element[] | NodeListOf<Element>,
  scrollTriggerEl?: Element
): gsap.core.Tween {
  return gsap.from(elements, {
    opacity: 0,
    y: 48,
    duration: 0.7,
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: scrollTriggerEl
      ? {
          trigger: scrollTriggerEl,
          start: "top 80%",
          toggleActions: "play none none none",
        }
      : undefined,
  });
}

// Parallax effect
export function createParallax(
  element: Element,
  speed = 0.5
): ScrollTrigger {
  return ScrollTrigger.create({
    trigger: element,
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      gsap.set(element, {
        y: self.progress * 100 * speed,
      });
    },
  });
}

// Horizontal scroll section
export function createHorizontalScroll(
  container: Element,
  track: Element
): ScrollTrigger {
  const trackEl = track as HTMLElement;
  const containerEl = container as HTMLElement;

  const totalWidth = trackEl.scrollWidth - containerEl.offsetWidth;

  gsap.to(track, {
    x: -totalWidth,
    ease: "none",
    scrollTrigger: {
      trigger: container,
      start: "top top",
      end: () => `+=${totalWidth}`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    },
  });

  return ScrollTrigger.getAll().slice(-1)[0];
}

// Section reveal
export function revealSection(element: Element): gsap.core.Tween {
  return gsap.from(element, {
    opacity: 0,
    y: 60,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: {
      trigger: element,
      start: "top 75%",
      toggleActions: "play none none none",
    },
  });
}
