import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import 'fake-indexeddb/auto'

expect.extend(matchers)

// jsdom has no media query support; the app reads it for the system theme.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}
