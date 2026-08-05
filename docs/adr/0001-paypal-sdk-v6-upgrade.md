# PayPal JavaScript SDK v5 to v6 Upgrade

The PayPal JavaScript SDK v6 introduces a component-based architecture with web components, explicit SDK initialization via `createInstance()`, and a requirement for server-side order creation and capture. We upgraded from `@paypal/react-paypal-js@^7.3.3` (wrapping `@paypal/paypal-js@5.1.6`) to `@paypal/react-paypal-js@^10.0.0` which provides the v6 API via `@paypal/react-paypal-js/sdk-v6`.

The key architectural shift is that order creation and capture moved from client-side (via the SDK's `actions.order.create()` and `actions.order.capture()`) to server-side (via a Netlify function calling the PayPal Orders REST API). This is required because v6's `createOrder` callback must return `{ orderId }` rather than calling SDK actions.

Legacy hosted-button subscriptions (`Subscription.tsx`) were left unchanged — they use PayPal's `cgi-bin/webscr` form POST and are unrelated to the JS SDK.

The `environment` prop is now required on `PayPalProvider` and defaults to `"production"` via `NEXT_PUBLIC_PAYPAL_ENV`. Button styling options (`shape`, `color`, `layout`) were dropped in favor of v6's default web component appearance, with `type` replacing the `label` style option.
