import { createApp } from './app/create-app.js'
import { notFoundHandler } from './app/middleware/error-handler.js'

/**
 * Affiliate OS — Worker entrypoint (Cloudflare Pages Functions).
 */
const app = createApp()

/**
 * Cloudflare Pages bundler compatibility.
 *
 * `@hono/vite-cloudflare-pages` wraps this app inside an OUTER Hono instance:
 *
 *   worker.route('/', app)
 *   worker.notFound(app.notFoundHandler)
 *
 * `route()` merges only routes/middleware — the inner app's not-found handler
 * is NOT carried over, so the wrapper has to read it back off the app object.
 * Since Hono v4 that handler lives in a private class field (`#notFoundHandler`),
 * so `app.notFoundHandler` is `undefined` and the outer worker ends up with
 * `notFound(undefined)`. The observed effect in production would be that every
 * unknown path answers `200` with an empty body instead of the canonical
 * `RESOURCE_NOT_FOUND` envelope required by DOC 22 §223.
 *
 * Exposing the handler here restores the contract without patching the
 * dependency and without weakening `createApp()`, which stays the single
 * composition root.
 */
Object.defineProperty(app, 'notFoundHandler', {
  value: notFoundHandler,
  enumerable: false,
  configurable: true,
})

export default app
