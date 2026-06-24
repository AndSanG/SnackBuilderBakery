# Assumptions

Interpretations made where the challenge left a requirement open. Each notes the reasoning so reviewers can see where gaps were filled.

## 1. Menu item shape is minimal

A menu item has only a name, a category, and a price. No description, image, or availability flag for now.

Reasoning: keeps the storefront simple; extra fields add nothing to the scheduling problem that is the focus of the challenge.

## 2. Priority tier is derived from the order source

The customer does not choose a priority. It is assigned from where the order comes from:

- VIP (Tier 1): a premium channel offered through the app
- App / Delivery (Tier 2): the standard app channel
- Walk-in (Tier 3): in-person orders

Reasoning: VIP is an app-only offering, not something a walk-in customer can request. Deriving the tier from the source keeps priority assignment out of the customer's hands.

## 3. Order lifecycle is payment-gated

The flow is: the customer requests items, receives a ticket with the price to pay, pays, and on successful payment the order is confirmed, enters the kitchen queue, and the customer receives a confirmation with the estimated ready time. An order enters the kitchen only after payment is confirmed, so no unpaid orders ever sit in the queue.

Reasoning: the estimated ready time is computed at confirmation, which coincides with queue entry, so the estimate cannot go stale between placement and payment.

## 4. One item occupies one oven slot

Each item bakes on its own tray. An order of 3 cookies consumes 3 of the 6 available slots.

Reasoning: the challenge speaks of items in ovens, not orders. Modeling the tray as a single item makes capacity math and estimation direct.

## 5. An order is ready when its last item finishes

For an order with mixed bake times, the estimated ready time is the completion time of the slowest item.

Reasoning: the customer receives the complete order at once, so readiness is bounded by the last item to finish.
