'use client';

import { useCounterAnimation, useParallax, useScrollAnimations } from '@/app/hooks';

/** Runs the existing DOM-driven animations; renders nothing. */
export function HomeEffects() {
  useScrollAnimations();
  useCounterAnimation();
  useParallax('.image-frame img');
  return null;
}
