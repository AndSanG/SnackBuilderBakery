# Domain Model

Separation of pure domain models from the data-transfer objects that cross the API boundary. Domain models have no framework imports, no validation decorators, and no JSON concerns. DTOs carry validation and are mapped to and from domain models at the edge.

Scope is the current iteration (Menu, Order Placement, FIFO Kitchen Scheduler, Capacity-Based Estimation). Prices are plain numbers (integer cents).

## Domain models

| Type | Shape | Notes |
|------|-------|-------|
| `Category` | Cookie, Pastry, Bread | Each category maps to a bake duration (Cookie 5 min, Pastry 10 min, Bread 20 min). The bake-time rule lives here. |
| `MenuItem` | id, name, category, price | Core storefront entity. Price is integer cents. |
| `OrderSource` | Vip, AppDelivery, WalkIn | Where the order came from. |
| `PriorityTier` | Tier1, Tier2, Tier3 | Derived from `OrderSource` (Vip to Tier1, AppDelivery to Tier2, WalkIn to Tier3). |
| `OrderItem` | id, category, bakeDuration | The unit that bakes. One item occupies one oven slot. |
| `Order` | id, items, source, priorityTier, status, totalPrice, estimatedReadyTime | Aggregate root for an order. |
| `OrderStatus` | AwaitingPayment, InKitchen, Ready | Minimal lifecycle for this iteration. |
| `BakingItem` | orderItem, startedAt | `finishAt` is derived as `startedAt + bakeDuration`. No stored end time. |
| `Ovens` | slots (6), each free or holding a `BakingItem` | Tracks capacity: which slots are occupied and when each frees. Six flat slots for now (see Deferred modeling decisions). |
| `Queue` | ordered waiting items | The waiting line of items not yet baking. |
| `SchedulingPolicy` | strategy: orders the queue | Decides which waiting item bakes next. `FifoPolicy` now; `PriorityPolicy` later. Swappable without touching `Ovens` or `Queue`. |
| `Kitchen` | ovens, queue, policy | Aggregate that owns all kitchen state and is the sole owner of scheduling. Composes `Ovens`, `Queue`, and a `SchedulingPolicy`. |

### Rules captured in the domain

- Bake duration is a function of `Category`, not stored per item.
- `PriorityTier` is derived from `OrderSource`; it is never chosen by the customer.
- An order is ready when its last item finishes; `estimatedReadyTime` is the latest item finish time.
- The kitchen is poll-based: completion is computed from `BakingItem.startedAt` against the clock, never from a timer.
- The order in which waiting items bake is decided by a `SchedulingPolicy` (Strategy), not hardcoded. FIFO now, priority later, with no change to `Ovens` or `Queue`. See [module-map.md](module-map.md) for the reasoning.

## Deferred modeling decisions

### Oven identity

The `Kitchen` uses six flat, anonymous slots rather than two ovens of three trays each. Scheduling and estimation only need a pool of six slots, so the oven grouping is not modeled yet.

Oven identity (which item is in which oven) is required by Kitchen Monitoring (feature 6), which is out of scope for this iteration. When that feature is built, slots will gain an oven reference. We accept that this reworks the kitchen aggregate at that point, in exchange for a simpler model now.

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
