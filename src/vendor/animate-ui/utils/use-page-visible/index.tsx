// File: src/vendor/animate-ui/utils/use-page-visible/index.tsx
'use client';

import * as React from 'react';

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

function usePageVisible() {
  return React.useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  );
}

export { usePageVisible };