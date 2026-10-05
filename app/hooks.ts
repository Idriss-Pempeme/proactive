'use client';

import { useEffect } from 'react';

/**
 * Custom hook for scroll-triggered animations via IntersectionObserver.
 * Adds the 'visible' class to elements with animation classes.
 */
export function useScrollAnimations() {
  useEffect(() => {
    const animatedElements = document.querySelectorAll<HTMLElement>(
      '.fade-up, .fade-left, .fade-right, .scale-in, .stagger-children'
    );

    if (!('IntersectionObserver' in window)) {
      animatedElements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.15 }
    );

    animatedElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

/**
 * Custom hook for animating counter elements on scroll.
 */
export function useCounterAnimation() {
  useEffect(() => {
    const counterElements = document.querySelectorAll<HTMLElement>('.counter-value[data-target]');

    if (!counterElements.length || !('IntersectionObserver' in window)) return;

    function animateCounter(el: HTMLElement) {
      const target = parseInt(el.getAttribute('data-target') ?? '0', 10);
      const suffix = el.getAttribute('data-suffix') || '+';
      const duration = 2000;
      const startTime = performance.now();

      function updateCount(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(updateCount);
      }

      requestAnimationFrame(updateCount);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counterElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

/**
 * Custom hook for the parallax effect on hero background images.
 */
export function useParallax(selector = '.hero-bg img') {
  useEffect(() => {
    const found = document.querySelector<HTMLElement>(selector);
    if (!found) return;
    const el: HTMLElement = found;

    function handleScroll() {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        el.style.transform = `translateY(${scrolled * 0.3}px) scale(1.1)`;
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selector]);
}

/**
 * Custom hook for the subtle 3D tilt effect on cards (desktop only).
 */
export function useCardTilt(selectors = '.feature-card, .program-card, .testimonial-card') {
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    const cards = document.querySelectorAll<HTMLElement>(selectors);

    const handlers: {
      card: HTMLElement;
      handleMove: (e: MouseEvent) => void;
      handleLeave: () => void;
    }[] = [];

    cards.forEach(card => {
      const handleMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -3;
        const rotateY = ((x - centerX) / centerX) * 3;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      };

      const handleLeave = () => {
        card.style.transform = '';
      };

      card.addEventListener('mousemove', handleMove);
      card.addEventListener('mouseleave', handleLeave);
      handlers.push({ card, handleMove, handleLeave });
    });

    return () => {
      handlers.forEach(({ card, handleMove, handleLeave }) => {
        card.removeEventListener('mousemove', handleMove);
        card.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, [selectors]);
}
