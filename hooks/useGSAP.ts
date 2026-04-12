"use client";

import { useRef, useEffect, RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGSAP<T extends Element = HTMLDivElement>(
  callback: (context: { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger }) => void,
  deps: React.DependencyList = []
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      callback({ gsap, ScrollTrigger });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
