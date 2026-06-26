# Testing Strategy

How we cover the bakery, from automated tests up to manual checks. This is the
map of what is verified and where; [testing.md](testing.md) covers the tooling
(Jest, spec layout, fakes) and [agents/testing.md](agents/testing.md) the
principles.

The aim: every behavior is pinned by an automated test, and the manual layer
exists only to spot-check the wiring a human sees (the running HTTP server and
the browser tester) that the automated suite stubs out, mainly the real clock.

## Layers

We lean on a test pyramid: most coverage sits low and cheap, a thin slice runs
the whole app.

| Layer | What it exercises | Doubles | Example specs |
| --- | --- | --- | --- |
| Domain | Pure rules: scheduling, bake times, priority tiers | None | `kitchen.spec.ts`, `scheduling-policy.spec.ts`, `priority-tier.spec.ts` |
| Application | One use case against ports | Fake repositories, fake clock | `place-order.spec.ts`, `confirm-payment.spec.ts`, `reconcile-orders.spec.ts` |
| Infrastructure | Adapters that implement a port | In-memory backing | `in-memory-order-repository.spec.ts`, `kitchen-service.adapter.spec.ts` |
| Presentation | Controllers and exception filters map HTTP to use cases | Stubbed use cases | `menu.controller.spec.ts`, `orders-exception.filter.spec.ts` |
| End to end | The real app over HTTP: routing, validation pipe, filters, DI graph | `FakeClock` only | `test/app.e2e-spec.ts` |
| Manual | The running server plus the browser tester | None (real clock) | `public/tester.html` |

The one thing the automated suite controls that manual cannot is time: e2e
overrides `CLOCK` with a `FakeClock` it advances instantly. In manual testing
the clock is real, so an order only becomes `Ready` after its bake time has
actually elapsed (see the note under Reconcile Kitchen).

## Coverage by use case

Each use case lists its happy path and the edge cases that matter, where each is
pinned automatically, and how to reproduce it by hand against
[public/tester.html](../public/tester.html). Reference data: prices are integer
cents; bake times are Cookie 5, Pastry 10, Bread 20 minutes; the oven has 6
slots; priority runs Vip > AppDelivery > WalkIn.

### View Menu (`GET /menu`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Lists items with name, category, price | Happy | `view-menu.spec.ts`, `menu.controller.spec.ts` | Add an item, then **View Menu**, see it listed |
| Empty bakery returns `[]` | Edge | `view-menu.spec.ts` | **View Menu** on a fresh server returns `[]` |

### Add Menu Item (`POST /menu`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Valid item is created and returned with an id | Happy | `add-menu-item.spec.ts`, e2e `createCookie` | **Add Menu Item**, copy the returned `id` |
| Missing or empty name | Edge (400) | controller and DTO validation | clear name, **Add Menu Item**, expect 400 |
| Unknown category | Edge (400) | DTO `@IsEnum` | edit the select out of range via the body, expect 400 |
| Price below 1 or non-integer | Edge (400) | DTO `@IsInt @Min(1)` | set price to 0, expect 400 |

### Update Menu Item (`PATCH /menu/:id`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Existing item reflects new details | Happy | `update-menu-item.spec.ts` | put a real `id`, change price, **Update Menu Item** |
| Unknown id | Edge (404) | `menu-item-not-found.filter.spec.ts` | use a made-up `id`, expect 404 |
| Invalid field value | Edge (400) | DTO validation | set price to 0, expect 400 |

### Remove Menu Item (`DELETE /menu/:id`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Item is removed, 204 no body | Happy | `remove-menu-item.spec.ts` | **Remove Menu Item** on a real `id`, then **View Menu** to confirm it is gone |
| Unknown id | Edge (404) | not-found filter | made-up `id`, expect 404 |

### Place Order (`POST /orders`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Priced ticket, status AwaitingPayment, priority from source | Happy | `place-order.spec.ts`, e2e | **Place Order** with a real `menuItemId`, see `orderId` and total |
| Multiple items and quantities sum correctly | Happy | `place-order.spec.ts` | two lines in the items JSON, check the total |
| Empty items list | Edge (400) | `place-order.spec.ts`, e2e malformed | items `[]`, expect 400 |
| Unknown menu item | Edge (400) | `place-order.spec.ts` | a bogus `menuItemId`, expect 400 |
| Quantity below 1 | Edge (400) | DTO validation | quantity 0, expect 400 |

### Confirm Payment (`POST /orders/:id/confirm`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Enqueues items, status InKitchen, returns estimate | Happy | `confirm-payment.spec.ts`, e2e | **Confirm Payment** on a placed order, see `estimatedReadyTime` |
| Estimate reflects oven contention | Edge | `confirm-payment.ripple.spec.ts` | confirm more than 6 items worth of orders, later estimates push out |
| Unknown order | Edge (404) | `orders-exception.filter.spec.ts` | made-up order id, expect 404 |
| Confirming twice | Edge (409) | `confirm-payment.spec.ts`, e2e | **Confirm Payment** twice, second returns 409 |

### Track Order (`GET /orders/:id`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Returns current status | Happy | `track-order.spec.ts`, e2e | **Track Order**, watch status change across the lifecycle |
| Unknown order | Edge (404) | `track-order.spec.ts`, e2e | made-up id, expect 404 |

### Reconcile Kitchen (`POST /orders/reconcile`)

| Case | Type | Automated | Manual |
| --- | --- | --- | --- |
| Finished items complete, their orders flip to Ready | Happy | `reconcile-orders.spec.ts`, e2e (advances clock 5 min) | confirm a cookie order, wait 5 real minutes, **Reconcile Kitchen**, **Track Order** shows Ready |
| Nothing elapsed yet leaves orders InKitchen | Edge | `reconcile-orders.spec.ts` | **Reconcile Kitchen** right after confirming: still InKitchen |
| Full oven holds waiting items back until a slot frees | Edge | `kitchen.spec.ts`, ripple spec | confirm more than 6 items, reconcile early, the overflow stays queued |

The clock caveat: e2e fast-forwards time with `FakeClock`. Manual testing uses
the real system clock, so readiness only appears after the bake time has truly
passed. To see Ready without waiting, prefer the e2e test; the manual path is
for confirming the HTTP plumbing, not for racing the oven.

## Running it

```bash
npm test           # all automated layers, random order
npm run test:cov   # with coverage (the CI floor is 90%)
npm run test:e2e   # the HTTP end-to-end suite
npm run start      # then open public/tester.html for the manual layer
```

## What is deliberately not covered

In scope for the strategy but out of scope for the current build, tracked in
[backlog.md](backlog.md): authentication and authorization on the management
endpoints, and real payment failure paths (payment currently auto-succeeds).
When those land, each gets its own row above.
