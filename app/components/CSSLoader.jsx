'use client';

import { useEffect } from 'react';

export default function CSSLoader() {
  useEffect(() => {
    // Import global CSS dynamically after component mount
    import('../globals.css').then(() => {
      // Remove hidden class once CSS is loaded
      document.body.classList.remove('hidden-until-loaded');
    });
  }, []);

  return null;
}