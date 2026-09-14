import createCache from '@emotion/cache';

// Shared Emotion cache so server and client generate identical class names.
// `prepend` keeps MUI styles first in <head> so theme overrides win.
export default function createEmotionCache() {
  return createCache({ key: 'mui', prepend: true });
}
