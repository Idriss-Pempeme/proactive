'use client';

import { useState, useEffect } from 'react';

export default function PageLoader() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 600);
    const removeTimer = setTimeout(() => setRemoved(true), 1100);
    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (removed) return null;

  return (
    <div className={`page-loader${hidden ? ' hidden' : ''}`}>
      <div className="loader-spinner"></div>
    </div>
  );
}
