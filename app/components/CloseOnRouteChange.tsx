'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Calls onChange when the pathname changes after mount. Renders nothing. */
export function CloseOnRouteChange({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const last = useRef(pathname);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    if (last.current !== pathname) {
      last.current = pathname;
      cb.current();
    }
  }, [pathname]);
  return null;
}
