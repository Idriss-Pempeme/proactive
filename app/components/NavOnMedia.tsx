'use client';

import { useEffect } from 'react';

/**
 * Renders nothing; while mounted, the nav sits light-on-film over a dark hero
 * (until the page scrolls). A body flag rather than a CSS :has, because Next keeps
 * visited pages mounted but hidden and cleans up their effects, so the flag
 * leaves with the page.
 */
export function NavOnMedia() {
  useEffect(() => {
    document.body.dataset.navOnMedia = '';
    return () => {
      delete document.body.dataset.navOnMedia;
    };
  }, []);
  return null;
}
