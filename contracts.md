# Contracts

The contracts that hold the system together, described as operations with inputs, outputs, and outcomes. No framework or language is named here on purpose: the design is meant to stand on its own, and the chosen stack (see [architecture-decisions.md](architecture-decisions.md)) is only one way to realize it.

Two kinds of contract appear here:

- Ports: the boundaries between layers and modules. A port is owned by its consumer and implemented by a provider (see [module-map.md](module-map.md)).
- Use case contracts: the command each use case accepts and the result or error it returns.

## Ports

### Clock

Owned by Shared. Implemented by the system clock.

| Operation | Input | Output |
|-----------|-------|--------|
| now | none | the current instant |

### MenuRepository

Owned by Menu. Implemented by Menu infrastructure.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| add | a menu item | the stored item |
| update | a menu item | the updated item, or not found |
| remove | an item id | success, or not found |
| getAll | none | all menu items |
| findById | an item id | the item, or none |

### OrderRepository

Owned by Orders. Implemented by Orders infrastructure.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| save | an order | the stored order |
| findById | an order id | the order, or none |

### MenuCatalog

Owned by Orders. Implemented by a Menu adapter. Exposes only what Orders needs to validate and price an order.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| findItem | an item id | the item's id, category, and price, or none |

### KitchenScheduler

Owned by Orders. Implemented by a Kitchen adapter.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| enqueue | the bakeable items of a confirmed order, each carrying its category and owning order reference | the items placed in the kitchen queue |

### ReadyTimeEstimator

Owned by Orders. Implemented by a Kitchen adapter. Pure: it reads kitchen state but never changes it.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| estimate | the bakeable items of an order | the estimated ready time (a future instant) |

## Use case contracts

| Use case | Input | Result | Error outcomes |
|----------|-------|--------|----------------|
| ViewMenu | none | all menu items | none |
| AddMenuItem | name, category, price | the created item | invalid data |
| UpdateMenuItem | item id, updated fields | the updated item | not found, invalid data |
| RemoveMenuItem | item id | success | not found |
| PlaceOrder | requested items (item id and quantity each), order source | a ticket: order reference and total price | unknown item, empty request |
| ConfirmPayment | order reference | a confirmation: order reference, status, estimated ready time | not found, already confirmed |
| TrackOrder | order reference | order reference, status, estimated ready time | not found |
| ReconcileKitchen | the current instant | the kitchen advanced: finished items completed, free slots filled from the queue | none |
| EstimateOrderReadyTime | an order's items, current kitchen state, the current instant | the estimated ready time | none |
