# Store & Payments

Handles one-time purchases (event tickets, gear, donations, sponsorships) and recurring subscriptions for the Rocky Gorge rugby club.

## Language

**Checkout**:
A one-time payment flow using the PayPal JS SDK. The buyer selects an amount, clicks a PayPal button, and completes payment in the PayPal popup.
_Avoid_: Purchase, transaction

**Hosted Subscription**:
A recurring payment via PayPal hosted button form POST. Uses PayPal's legacy `cgi-bin/webscr` endpoint with a hosted button ID. Not powered by the JS SDK.
_Avoid_: Subscription (ambiguous with PayPal Subscriptions API), recurring payment

**Store Item**:
A purchasable entry in `src/data/store.yml` with a slug, title, description, price options, and optional hosted subscriptions.
_Avoid_: Product, offering

**Order**:
A PayPal order created server-side via the PayPal Orders REST API (`POST /v2/checkout/orders`). Identified by an order ID string. Created with `intent: "CAPTURE"` and a purchase unit containing description and amount.
_Avoid_: Transaction

**Capture**:
Server-side confirmation that an approved PayPal order should be charged. Called via the PayPal Orders REST API (`POST /v2/checkout/orders/{orderId}/capture`).
_Avoid_: Charge, process
