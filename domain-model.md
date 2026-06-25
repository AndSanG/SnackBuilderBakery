# Domain Model

Separation of pure domain models from the data-transfer objects that cross the API boundary. Domain models have no framework imports, no validation decorators, and no JSON concerns. DTOs carry validation and are mapped to and from domain models at the edge.

Scope is the current iteration (Menu, Order Placement, FIFO Kitchen Scheduler, Capacity-Based Estimation). Prices are plain numbers (integer cents).

## Domain models

| Type | Shape | Notes |
|------|-------|-------|
| `Category` | Cookie, Pastry, Bread | Each category maps to a bake duration (Cookie 5 min, Pastry 10 min, Bread 20 min). The bake-time rule lives here. |
| `MenuItem` | id, name, category, price | Core storefront entity. Price is integer cents. |
| `OrderSource` | Vip, AppDelivery, WalkIn | Where the order came from. |
| `PriorityTier` | Tier1, Tier2, Tier3 | Not a stored field. Derived from `OrderSource` on read (Vip to Tier1, AppDelivery to Tier2, WalkIn to Tier3). |
| `OrderItem` | id, category, bakeDuration | The unit that bakes. One item occupies one oven slot. |
| `Order` | id, items, source, status, totalPrice, estimatedReadyTime | Aggregate root for an order. Priority tier is derived from `source`, not stored. |
| `OrderStatus` | AwaitingPayment, InKitchen, Ready | Minimal lifecycle for this iteration. |
| `BakingItem` | orderItem, startedAt | `finishAt` is derived as `startedAt + bakeDuration`. No stored end time. |
| `Kitchen` | slots (6, each a `BakingItem` or empty), queue (waiting items) | The single type that owns all kitchen state and scheduling. Holds the six slots and the waiting queue directly. Six flat slots for now (see Deferred modeling decisions). |

### Rules captured in the domain

- Bake duration is a function of `Category`, not stored per item.
- `PriorityTier` is derived from `OrderSource` on read; it is never stored and never chosen by the customer.
- An order is ready when its last item finishes; `estimatedReadyTime` is the latest item finish time.
- The kitchen is poll-based: completion is computed from `BakingItem.startedAt` against the clock, never from a timer.
- The order in which waiting items bake is FIFO for now, isolated to a single place in `Kitchen` (the choice of the next item). Priority ordering is the next iteration's work; introducing it is a localized change at that one point. See [module-map.md](module-map.md) for the reasoning.

## Deferred modeling decisions

### Oven identity

The `Kitchen` uses six flat, anonymous slots rather than two ovens of three trays each. Scheduling and estimation only need a pool of six slots, so the oven grouping is not modeled yet.

Oven identity (which item is in which oven) is required by Kitchen Monitoring (feature 6), which is out of scope for this iteration. When that feature is built, slots will gain an oven reference. We accept that this reworks the kitchen aggregate at that point, in exchange for a simpler model now.

### Scheduling policy abstraction

The ordering rule (which waiting item bakes next) is FIFO and lives in one method on `Kitchen`. We deliberately do not introduce a `SchedulingPolicy` Strategy interface yet, because it would have exactly one implementation. The Strategy is introduced in the same iteration that adds `PriorityPolicy` (feature 5), where the second implementation makes the abstraction earn its place. Until then, the single FIFO method is the seam: extracting an interface later is a localized change.

## DTOs (API boundary)

| DTO | Direction | Fields |
|-----|-----------|--------|
| `CreateMenuItemDto` | in | name, category, price |
| `UpdateMenuItemDto` | in | name?, category?, price? |
| `MenuItemResponseDto` | out | id, name, category, price |
| `PlaceOrderDto` | in | items [{ menuItemId, quantity }], source |
| `TicketResponseDto` | out | orderId, totalPrice |
| `OrderConfirmationResponseDto` | out | orderId, status, estimatedReadyTime |
| `OrderStatusResponseDto` | out | orderId, status, estimatedReadyTime |

### Mapping notes

- `PlaceOrderDto` carries a quantity per line. The application layer expands it into individual `OrderItem`s (3 cookies become 3 items, occupying 3 slots).
- DTOs never appear in the domain or application logic. Mappers translate between DTOs and domain models in the controller or application layer.
